const socketController = require('../socket_controller/socketController')

const socketRoutes = socket => {

    socket.on(
        "joinRoom", 
        data => socketController.joinRoom(socket,data)
    )

    socket.on(
        "startMatch", 
        data => socketController.startMatch(socket,data)
    )

    socket.on(
        "movePlayer",
        data => socketController.movePlayer(socket,data)
    )

    socket.on(
        "createBullet",
        data => socketController.createBullet(socket,data)
    )

    socket.on(
        "removePlayer",
        data => socketController.removePlayer(socket,data)
    )

    socket.on(
        "disconnect", 
        () => {
            socketController.removePlayerBySocketId(socket)
            console.log("User disconnected:", socket.id)
        }
    )
}

module.exports = socketRoutes