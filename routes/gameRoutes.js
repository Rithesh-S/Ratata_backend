const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const gameController = require('../controller/gameController')
const validator = require('../middleware/validator')

router.post(
    '/match/create',
    authMiddleware.authenticateToken,
    authMiddleware.validateBody(validator.createMatchSchema),
    gameController.createArena
)

router.get(
    '/match/:id/data',
    authMiddleware.authenticateToken,
    gameController.getLiveGameData
)

module.exports = router