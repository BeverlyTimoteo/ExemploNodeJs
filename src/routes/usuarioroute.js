const express = require('express');
const controller = require('../controller/usuariocontroller');

const router = express.Router();

router.post('/cadastro', controller.salvar);
router.post('/remover', controller.remover);

module.exports = router;