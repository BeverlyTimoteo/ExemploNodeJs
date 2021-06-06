const conexao = require('../database/conexao');

exports.getIdEmpresaCnpjChave = async (cnpj, chave, next) => {
    if ((cnpj == undefined) || (cnpj.trim() === '')) {
        return next(new Error('CNPJ não informado!'));
    }

    const con = conexao.Conexao();

    try {
        let result = await con.query('SELECT id FROM empresa WHERE cnpj = ? AND chave = ? AND fg_ativo = 1', [cnpj, chave]);

        if (result.length === 0) {
            return next(new Error('Nenhuma empresa encontrada!'));
        }

        return result[0].id;
    } catch (e) {
        return next(e);

    } finally {
        await con.close();
    }
};

exports.getEmpresaByCnpj = async (cnpj) => {
    const con = conexao.Conexao();

    try {
        let result = await con.query('SELECT * FROM empresa WHERE cnpj = ? AND fg_ativo = 1', [cnpj]);

        if (result.length === 0) {
            return;
        }

        return result[0];
    } finally {
        await con.close();
    }
};

exports.getEmpresaById = async (id) => {
    const con = conexao.Conexao();

    try {
        let result = await con.query('SELECT * FROM empresa WHERE id = ? AND fg_ativo = 1', [id]);

        if (result.length === 0) {
            return;
        }

        return result[0];
    } finally {
        await con.close();
    }
};

exports.getEmpresaGrupo = async (idUsuario, idEmpresaGrupo) => {
    const con = conexao.Conexao();

    try {
        let result = await con.query('SELECT id, cnpj, razao, id_empresa_grupo FROM empresa WHERE id IN (' +
            ' SELECT u.id_empresa FROM usuario u INNER JOIN empresa e ON e.id = u.id_empresa' +
            ' WHERE e.id_empresa_grupo = ? AND u.id_usuario = ?) AND fg_ativo = 1', [idEmpresaGrupo, idUsuario]);

        if (result.length === 0) {
            return;
        }

        return result;
    } finally {
        await con.close();
    }
};