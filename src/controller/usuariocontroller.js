const conexao = require('../database/conexao');
const empresa = require('./empresacontroller');
const util = require('util');

exports.salvar = async (req, res, next) => {
    let emp = req.body.empresa;
    let usuarios = req.body.usuarios;

    let idEmpresa = await empresa.getIdEmpresaCnpjChave(emp.cnpj, emp.chave, next);

    if (usuarios.length === 0) {
        return res.send(JSON.stringify({ msg: 'Nenhum usuário informado!' }));
    }

    const con = conexao.Conexao();

    try {
        await con.beginTransaction();

        let sql = 'INSERT INTO usuario (id_usuario, id_empresa, nome, senha, fg_bloqueado) ' +
            'VALUES ? ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha), fg_bloqueado = VALUES(fg_bloqueado)';

        let values = [];

        usuarios.forEach(s => {
            values.push([s.id_usuario, idEmpresa, s.nome, s.senha, s.fg_bloqueado]);
        });

        const userDb = await getUsuariosEmpresa(con, idEmpresa);

        let filtrado = userDb.filter(value => !usuarios.map(item => item.id_usuario).includes(value.id_usuario));

        filtrado.forEach(async user => {
            await con.query('DELETE FROM usuario WHERE id_usuario = ? AND id_empresa = ?', [user.id_usuario, idEmpresa]);
        });

        await con.query(sql, [values]);

        await con.commit();

        res.send(JSON.stringify({ msg: 'OK' }));
    } catch (e) {
        next(e);

    } finally {
        await con.close();
    }
};

exports.remover = async (req, res, next) => {
    let emp = req.body.empresa;
    let usuarios = req.body.usuarios;

    let idEmpresa = await empresa.getIdEmpresaCnpjChave(emp.cnpj, emp.chave, next);

    if (usuarios.length === 0) {
        return res.send(JSON.stringify({ msg: 'Nenhum usuário informado!' }));
    }

    const con = conexao.Conexao();

    try {
        await con.beginTransaction();

        usuarios.forEach(async s => {
            await con.query('DELETE FROM usuario WHERE id_usuario = ? AND id_empresa = ?', [s.id_usuario, idEmpresa]);
        });

        await con.commit();

        res.send(JSON.stringify({ msg: 'OK' }));
    } catch (e) {
        next(e);

    } finally {
        await con.close();
    }
};

async function getUsuariosEmpresa(conexao, id_empresa) {
    return await conexao.query('SELECT id_usuario FROM usuario WHERE id_empresa = ?', [id_empresa]);
};

exports.getUsuario = async (idEmpresa, nome, senha) => {
    const con = conexao.Conexao();

    try {
        let sql = 'SELECT u.* FROM usuario u' +
            ' INNER JOIN empresa e ON e.id = u.id_empresa AND e.id = ?' +
            ' WHERE UPPER(u.nome) = ? AND UPPER(u.senha) = ?';

        let result = await con.query(sql, [idEmpresa, nome, senha]);

        if (result.length === 0) {
            return;
        }

        return result[0];

    } finally {
        await con.close();
    }
};

exports.getUsuarioToken = (idEmpresa, idUsuario, callback) => {
    conexao.ConexaoCallback((err, con) => {
        if (err) {
            return callback(err, con);
        }

        con.query('SELECT * FROM usuario WHERE id_usuario = ? AND id_empresa = ? AND fg_bloqueado = ?',
            [idUsuario, idEmpresa, false], (err, results, fields) => {
                con.destroy();
                return callback(err, results);
            });
    });
}