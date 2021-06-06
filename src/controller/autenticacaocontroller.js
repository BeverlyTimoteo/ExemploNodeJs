const jwt = require('jsonwebtoken');
const constantes = require('../util/constantes');
const empresaController = require('./empresacontroller');
const usuarioController = require('./usuariocontroller');
const crypto = require('crypto-js');

module.exports = {

    verificarToken: function (req, res, next) {
        const token = req.get('Authorization');

        if (!token) {
            return res.status(401).json({ message: 'Usuário não autenticado!' });
        }

        jwt.verify(token, constantes.keyJWT, (err, decoded) => {
            if (err || !decoded) {
                return res.status(401).json({ message: 'Usuário não autenticado!' });
            }

            next();
        });
    },

    getUsuario: function (req, res, next) {
        const token = req.get('Authorization');

        jwt.verify(token, constantes.keyJWT,
            (err, decoded) => {
                const idUsuario = decoded.id_usuario;
                const idEmpresa = decoded.id_empresa;

                usuarioController.getUsuarioToken(idEmpresa, idUsuario, async (err, usuario) => {
                    let emp = {};

                    try {
                        emp = await empresaController.getEmpresaById(idEmpresa);

                    } catch (e) {
                        return res.status(500).json({ message: 'Erro ao consultar empresa!', error: e });
                    }

                    if (err || !usuario || (usuario.length == 0) || !emp) {
                        return res.status(500).json({ message: 'Erro ao recuperar usuário!', error: err });
                    }

                    usuario = usuario[0];

                    let empresas = await empresaController.getEmpresaGrupo(usuario.id_usuario, emp.id_empresa_grupo);

                    let token = jwt.sign({ id_usuario: usuario.id_usuario, id_empresa: usuario.id_empresa }, constantes.keyJWT, { expiresIn: constantes.expiresJWT });
                    delete usuario.senha;

                    return res.json({ ...usuario, token: token, empresas_usuario: empresas });
                });
            });
    },

    login: async function (req, res, next) {
        const cnpj = req.body.cnpj;
        const usuario = req.body.usuario;
        const senha = req.body.senha;
        let emp = {};

        try {
            emp = await empresaController.getEmpresaByCnpj(cnpj);

        } catch (e) {
            return res.status(500).json({ message: 'Erro ao consultar empresa!', error: e });
        }

        try {
            const faltaDados = (usuario == '' || usuario == null || senha == '' || senha == null || !emp);

            if (!faltaDados) {
                let user = await usuarioController.getUsuario(emp.id, usuario.toUpperCase(), crypto.MD5(senha.toUpperCase()).toString());

                if (user) {
                    let empresas = await empresaController.getEmpresaGrupo(user.id_usuario, emp.id_empresa_grupo);

                    let token = jwt.sign({ id_usuario: user.id_usuario, id_empresa: emp.id }, constantes.keyJWT, { expiresIn: constantes.expiresJWT });
                    delete user.senha;

                    return res.json({ ...user, token: token, empresas_usuario: empresas });
                }
            }

            return res.status(404).json({ message: 'Cnpj/Usuário não encontrado!' });

        } catch (e) {
            return res.status(500).json({ message: 'Erro ao obter login!', error: e });
        }
    },
}