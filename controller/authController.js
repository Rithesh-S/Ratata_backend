const JWTToken = require("../utils/jwtToken")
const hasher = require("../utils/hasher")
const dbModel = require("../model/dbModel")
const { v4: uuidv4 } = require("uuid")

async function signUp(req,res) {
    const user = req.body
    try {
        const usersCollection = await dbModel.getUsersCollection()
        const isUser = await usersCollection.findOne({ email: user.email })
        if(isUser) return res.status(400).json({ message: "User Already Exists!"})
        
        let userFormate = {
            userId: uuidv4(),
            ...user,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        userFormate.password = await hasher.hashPassword(userFormate.password)

        await usersCollection.insertOne(userFormate)
        const token = JWTToken({userId: userFormate.userId},'1d')
        return res.status(201).json({
            message: "User registered successfully",
            token
        })

    } catch (error) {
        console.error("Error Signup : ", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

async function login(req, res) {
    const { email, password } = req.query
    try {
        const usersCollection = await dbModel.getUsersCollection()
        const user = await usersCollection.findOne({ email })
        if (!user) return res.status(400).json({ message: "Invalid credentials" })

        const isMatch = await hasher.verifyPassword(password, user.password)
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" })

        const token = JWTToken({ userId: user.userId },'1d')
        res.status(200).json({ message: "Login successful", userName: user.userName, email: user.email, token })
    } catch (error) {
        console.error("Error Login:", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = {
    signUp,
    login
}