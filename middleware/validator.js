const Joi = require("joi")

const registerSchema = Joi.object({
    userName: Joi.string().min(3).max(30).required().messages({
        "string.empty": "UserName cannot be empty",
        "string.min": "UserName must be at least 3 characters",
        "string.max": "UserName must be atmost 30 characters",
        "any.required": "UserName is required",
    }),
    email: Joi.string().email().required().messages({
        "string.empty": "Email cannot be empty",
        "string.email": "Invalid email format",
        "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
    }),
})

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.empty": "Email cannot be empty",
        "string.email": "Invalid email format",
        "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password cannot be empty",
        "any.required": "Password is required",
    }),
})

const createMatchSchema = Joi.object({
    spawnCount: Joi.number().min(2).max(6).required().messages({
        "number.base": "Spawn count must be a number.",
        "number.min": "Spawn count must be at least 2.",
        "number.max": "Spawn count cannot be greater than 6.",
        "any.required": "Spawn count is required.",
    }),
})

const updateUserNameSchema = Joi.object({
    userName: Joi.string().min(3).max(30).required().messages({
        "string.base": "Username must be a string.",
        "string.empty": "Username cannot be empty.",
        "string.min": "Username must be at least 3 characters long.",
        "string.max": "Username cannot be longer than 30 characters.",
        "any.required": "Username is required.",
    }),
})

module.exports = {
    registerSchema,
    loginSchema,
    createMatchSchema,
    updateUserNameSchema
}