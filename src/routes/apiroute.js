const express = require('express');
const autenticacaoController = require('../controller/autenticacaocontroller');
const eventoController = require('../controller/eventocontroller');

const router = express.Router();

router.post('/login', autenticacaoController.login);

router.use(autenticacaoController.verificarToken);

router.post('/usuario', autenticacaoController.getUsuario);
router.post('/eventousuario', eventoController.getEventosUsuario);
router.get('/eventousuario/imagem/:idevento', eventoController.getEventoImagem);

module.exports = router;