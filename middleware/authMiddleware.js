const jwt = require('jsonwebtoken')

const secretKey = process.env.SECRET_KEY

function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1]

    if (!token) return res.status(401).json({ message: "Access denied. No token provided." })
    try {
        const decoded = jwt.verify(token, secretKey)
        req.user = decoded;
        next(); 
    } catch (error) {
        return res.status(403).json({ message: "Invalid token" });
    }
}

function authenticateTokenSocket(socket, next) {
    const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]

    if (!token) return next(new Error("Access denied. No token provided."))
    try {
        const decoded = jwt.verify(token, secretKey)
        socket.user = decoded
        next()
    } catch (error) {
        return next(new Error("Invalid token"))
    }
}

function validateBody(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false })
        if (error) {
            return res.status(400).json({
                message: "Validation Failed",
                errors: error.details.map((err) => err.message),
            })
        }
        next()
    }
}

const validateParams = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false })
    if (error) {
        return res.status(400).json({
            message: "Invalid parameters",
            errors: error.details.map((err) => err.message),
        })
    }
    next()
}

const validateQuery = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false })
    if (error) {
        return res.status(400).json({
            message: "Invalid query parameters",
            errors: error.details.map((err) => err.message),
        })
    }
    req.query = value
    next()
}

module.exports = {
    authenticateToken,
    authenticateTokenSocket,
    validateBody,
    validateParams,
    validateQuery
}