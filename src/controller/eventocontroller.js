const conexao = require('../database/conexao');
const empresa = require('./empresacontroller');
const jwt = require('jsonwebtoken');
const constantes = require('../util/constantes');

exports.salvar = async (req, res, next) => {
    let emp = req.body.empresa;
    let evento = req.body.evento;

    let idEmpresa = await empresa.getIdEmpresaCnpjChave(emp.cnpj, emp.chave, next);

    if (evento.id_evento === undefined || evento.id_evento <= 0) {
        return res.send(JSON.stringify({ msg: 'Nenhum agendamento informado!' }));
    }

    const con = conexao.Conexao();

    try {
        await con.beginTransaction();

        let sql = 'INSERT INTO evento SET ? ON DUPLICATE KEY UPDATE ' +
            'descricao_evento = VALUES(descricao_evento), observacao_evento = VALUES(observacao_evento), ' +
            'inicio = VALUES(inicio), termino = VALUES(termino), id_agenda = VALUES(id_agenda), ' +
            'agenda = VALUES(agenda), id_cliente = VALUES(id_cliente), cliente = VALUES(cliente), ' +
            'id_animal = VALUES(id_animal), animal = VALUES(animal), id_atendente = VALUES(id_atendente), ' +
            'atendente = VALUES(atendente), id_usuario = VALUES(id_usuario), logradouro = VALUES(logradouro), ' +
            'telefone = VALUES(telefone), celular = VALUES(celular), id_bairro = VALUES(id_bairro), ' +
            'bairro = VALUES(bairro), cidade = VALUES(cidade), uf = VALUES(uf), empresa = VALUES(empresa)';

        evento.id_empresa = idEmpresa;

        if (evento.descricao_evento === '') {
            delete evento.descricao_evento;
        }

        if (evento.empresa === '') {
            delete evento.empresa;
        }

        if (evento.observacao_evento === '') {
            delete evento.observacao_evento;
        }

        if (evento.telefone === '') {
            delete evento.telefone;
        }

        if (evento.celular === '') {
            delete evento.celular;
        }

        if (evento.id_animal === 0 || evento.animal === '') {
            delete evento.id_animal;
            delete evento.animal;
        }

        if (evento.imagens) {
            let imagens = [];

            evento.imagens.forEach(item => {
                imagens.push([idEmpresa, evento.id_evento, item]);
            });

            delete evento.imagens;

            let sqlImagem = 'INSERT INTO evento_imagem (id_empresa, id_evento, imagem)' +
                ' VALUES ? ON DUPLICATE KEY UPDATE imagem = VALUES(imagem)';

            if  (imagens.length > 0) {
                await con.query(sqlImagem, [imagens]);
            }
        }

        await con.query(sql, evento);

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
    let evento = req.body.evento;

    let idEmpresa = await empresa.getIdEmpresaCnpjChave(emp.cnpj, emp.chave, next);

    if (evento.id_evento === undefined || evento.id_evento <= 0) {
        return res.send(JSON.stringify({ msg: 'Nenhum agendamento informado!' }));
    }

    const con = conexao.Conexao();

    try {
        let eventos = await getEventosEmpresa(con, idEmpresa, evento.id_evento);

        if (eventos.length === 0) {
            return res.send(JSON.stringify({ situacao: 'OK', msg: 'Agendamento não encontrado!' }));
        }

        await con.beginTransaction();

        await con.query('DELETE FROM evento_imagem WHERE id_empresa = ? AND id_evento = ?', [idEmpresa, evento.id_evento]);
        await con.query('DELETE FROM evento WHERE id_empresa = ? AND id_evento = ?', [idEmpresa, evento.id_evento]);

        await con.commit();

        res.send(JSON.stringify({ situacao: 'OK', msg: 'Agendamento removido com sucesso!' }));
    } catch (e) {
        next(e);

    } finally {
        await con.close();
    }
};

async function getEventosEmpresa(conexao, id_empresa, id_evento) {
    return await conexao.query('SELECT id_evento FROM evento WHERE id_empresa = ? AND id_evento = ?', [id_empresa, id_evento]);
};

exports.getEventosUsuario = (req, res, next) => {
    const token = req.get('Authorization');

    jwt.verify(token, constantes.keyJWT, async (err, decoded) => {
        if (err) {
            return res.status(500).json({ message: 'Não foi possível recuperar usuário!', error: err });
        }

        const idUsuario = decoded.id_usuario;
        const idEmpresa = decoded.id_empresa;

        const con = conexao.Conexao();

        try {
            let sql;
            let param = [];

            if (req.body && req.body.view && req.body.view !== '') {
                sql = 'SELECT * FROM evento WHERE TRUE';

                if (req.body.dtInicio !== '') {
                    sql += ' AND CAST(inicio AS DATE) >= ?';
                    param.push(req.body.dtInicio);
                } else {
                    sql += ' AND CAST(inicio AS DATE) >= CURRENT_DATE()';
                }

                if (req.body.dtTermino !== '') {
                    param.push(req.body.dtTermino);
                    sql += ' AND CAST(termino AS DATE) <= ?';
                }

                if (req.body.view === 'user') {
                    sql += ' AND id_usuario = ?'
                    param.push(idUsuario);
                }

                sql += ' AND id_empresa = ? ORDER BY inicio';
                param.push(idEmpresa);

            } else {
                sql = 'SELECT * FROM evento WHERE CAST(inicio AS DATE) >= CURRENT_DATE()' +
                    ' AND id_empresa = ? AND id_usuario = ? ORDER BY inicio'

                param = [idEmpresa, idUsuario];
            }

            let result = await con.query(sql, param);

            return res.json(result);

        } catch (e) {
            return res.status(500).json({ message: 'Erro ao consultar agendamentos!', error: e });

        } finally {
            await con.close();
        }
    });
}

exports.getEventoImagem = (req, res, next) => {
    const token = req.get('Authorization');

    jwt.verify(token, constantes.keyJWT, async (err, decoded) => {
        if (err) {
            return res.status(500).json({ message: 'Não foi possível recuperar usuário!', error: err });
        }

        const idEmpresa = decoded.id_empresa;

        const con = conexao.Conexao();

        try {
            let sql = 'SELECT imagem FROM evento_imagem WHERE id_empresa = ? AND id_evento = ?';

            let result = await con.query(sql, [idEmpresa, req.params.idevento]);

            return res.json(result);

        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'Erro ao consultar imagem!', error: e });

        } finally {
            await con.close();
        }
    });
}