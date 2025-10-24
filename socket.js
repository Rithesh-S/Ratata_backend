let io

module.exports = {
    init: (server, cors) => {
        const { Server } = require("socket.io")
        io = new Server(server, { cors })
        return io
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!")
        }
        return io
    }
}
