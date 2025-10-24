const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const authController = require('../controller/authController')
const validator = require('../middleware/validator')

router.post(
    '/signup',
    authMiddleware.validateBody(validator.registerSchema),
    authController.signUp
)

router.get(
    '/login',
    authMiddleware.validateQuery(validator.loginSchema),
    authController.login
)

module.exports = router