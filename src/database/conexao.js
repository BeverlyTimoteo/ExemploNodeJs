const util = require('util');
const mysql = require('mysql');

let ConexaoCallback = (callback) => {

    let conexao = mysql.createPool({
        connectionLimit: 100,
        host: process.env.HOST_DB,
        user: process.env.USER_DB,
        password: process.env.PASS_DB,
        database: process.env.DB,
        multipleStatements: true,
    });

    conexao.getConnection((err, con) => callback(err, con));
}

let Conexao = () => {

    let config = {
        connectionLimit: 100,
        host: process.env.HOST_DB,
        user: process.env.USER_DB,
        password: process.env.PASS_DB,
        database: process.env.DB,
        multipleStatements: true,
    };

    let connection = mysql.createConnection(config);

    return {
        query(sql, args) {
            return util.promisify(connection.query).call(connection, sql, args);
        },
        close() {
            return util.promisify(connection.end).call(connection);
        },
        beginTransaction() {
            return util.promisify(connection.beginTransaction).call(connection);
        },
        commit() {
            return util.promisify(connection.commit).call(connection);
        },
        rollback() {
            return util.promisify(connection.rollback).call(connection);
        }
    }
};

module.exports = {
    Conexao,
    ConexaoCallback
};