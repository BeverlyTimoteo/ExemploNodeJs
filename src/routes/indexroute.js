const express = require('express');

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send({
        title: "Exemplo em Node Js - API",
        version: "1.0.0",
        author: "Beverly Timóteo"
    });
});

module.exports = router;