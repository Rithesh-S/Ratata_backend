const http = require("http")
const socketManager = require("./socket")
const { authenticateTokenSocket } = require('./middleware/authMiddleware')

const socketRoutes = require('./socket_routes/socketRoutes')

const createSocketServer = (app, cors) => {
    const server = http.createServer(app)
    const io = socketManager.init(server, cors)

    io.use(authenticateTokenSocket)

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id)
        socketRoutes(socket)
    })

    return server
}

module.exports = createSocketServer
