const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const userController = require('../controller/userController')
const validator = require('../middleware/validator')

router.put(
    '/profile/update',
    authMiddleware.authenticateToken,
    authMiddleware.validateBody(validator.updateUserNameSchema),
    userController.updateUserName
)

router.get(
    '/history',
    authMiddleware.authenticateToken,
    userController.getPlayerStats
)

router.get(
    '/stats',
    authMiddleware.authenticateToken,
    userController.getAggregatedPlayerStats
)


module.exports = router