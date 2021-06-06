const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const dotenv = require('dotenv');
const cors = require("cors")

const indexRoute = require('./routes/indexroute');
const usuarioRoute = require('./routes/usuarioroute');
const eventoRoute = require('./routes/eventoroute');
const apiRoute = require('./routes/apiroute');

const result = dotenv.config({ path: './environment/.env' });

if (result.error) {
    throw result.error;
}

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(logger('combined'));
app.use(cors());

app.use('/', indexRoute);
app.use('/usuario', usuarioRoute);
app.use('/evento', eventoRoute);
app.use('/api', apiRoute);

app.use((req, res, next) => {
    res.status(404).send(JSON.stringify({ msg: 'Endpoint not found!' }));
});

app.use((error, req, res, next) => {
    console.log(error);
    res.send(JSON.stringify({ msg: error.message }));
});

module.exports = app;