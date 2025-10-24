const Player = require('../model/playerModel');
const gameState = require('../utils/gameStateSingleton');
const { getIO } = require('../socket');
const Bullet = require('../model/bulletModel');

const HEALTH = 100;
const X = 0;
const Y = 0;
const SCORE = 0;
const DIRECTION = 'up';

async function joinRoom(socket, data) {
	const { roomId, userName } = data
	const playerId = socket.user?.userId
	try {
		const matchId = gameState.matchMapping[roomId]
		await socket.join(matchId)

		const playerData = new Player({
			playerId,
			socketId: socket.id,
			userName: userName,
			health: HEALTH,
			score: SCORE,
			x: X,
			y: Y,
			direction: DIRECTION,
		})

		const response = gameState.addPlayerToMatch(roomId, playerData)
		if (!response.success) {
			await socket.leave(matchId)
			return getIO().to(socket.id).emit('roomResponse', {  //emit
				type: 'error',
				message: response.message
			})
		}

		// console.log(`Socket ${socket.id} joined room ${matchId}`)      //console.log

		getIO().to(matchId).emit('roomResponse', {  //emit
			type: 'success',
			message: response.message,
		})

	} catch (err) {
		console.error(err);
		getIO().to(socket.id).emit('roomResponse', { //emit
			type: 'error',
			message: 'An error occurred while joining the room.'
		});
	}
}

async function startMatch(socket, data) {
	const { roomId } = data
	const playerId = socket.user?.userId
	try {
		const matchId = gameState.matchMapping[roomId]
		const response = gameState.startMatch(roomId,playerId)
		if (!response.success) {
			return getIO().to(socket.id).emit('roomResponse', {  //emit
				type: 'error',
				message: response.message
			})
		}

		console.log(`Socket ${socket.id} started room ${matchId}`)

		getIO().to(matchId).emit('roomResponse', {  //emit
			type: 'success',
			message: response.message,
		})

	} catch (err) {
		console.error(err);
		getIO().to(socket.id).emit('roomResponse', { //emit
			type: 'error',
			message: 'An error occurred while starting the room.'
		});
	}
}

async function removePlayer(socket, data) {
	const { roomId } = data
	const playerId = socket.user?.userId
	try {
		const matchId = gameState.matchMapping[roomId]
		const response = gameState.removePlayer(playerId)
		if (!response) {
			return getIO().to(socket.id).emit('roomResponse', {  //emit
				type: 'error',
				message: `Unable to leave the room: ${roomId}`
			})
		}

		console.log(`Socket ${socket.id} left room ${matchId}`)

		getIO().to(matchId).emit('roomResponse', {  //emit
			type: 'success',
			message: `Player ${response} has left the room!`,
		})

	} catch (err) {
		console.error(err);
		getIO().to(socket.id).emit('roomResponse', { //emit
			type: 'error',
			message: 'An error occurred while leaving the room.'
		});
	}
}

async function removePlayerBySocketId(socket) {
	const socketId = socket.id
	try {
		const response = gameState.removePlayerBySocketId(socketId)
		if (!response.success) {
			return getIO().to(socket.id).emit('roomResponse', {  //emit
				type: 'error',
				message: response.reason
			})
		}
		const { userName, matchId } = response.data
		
		getIO().to(matchId).emit('roomResponse', {               //emit
			type: 'success',
			message: `Player ${userName} is disconnected!`,
		})

	} catch (err) {
		console.error(err)
		getIO().to(socket.id).emit('roomResponse', {            //emit
			type: 'error',
			message: 'An error occurred while disconnecting from the room.'
		});
	}
}

async function movePlayer(socket,data) {
	const socketId = socket.id
	const playerId = socket.user?.userId
	const { dir } = data
	try {
		const response = gameState.updatePlayerPosition(playerId,dir)
		if (!response.success) {
			return getIO().to(socketId).emit('stateUpdateResponse', {  //emit
				type: 'error',
				message: response.message
			})
		}
		
		getIO().to(socketId).emit('stateUpdateResponse', {               //emit
			type: 'success',
			message: response.message,
		})

	} catch (err) {
		console.error(err)
		getIO().to(socketId).emit('stateUpdateResponse', {            //emit
			type: 'error',
			message: 'An error occurred while moving the player.'
		});
	}
}

async function createBullet(socket,data) {
	const socketId = socket.id
	const playerId = socket.user?.userId
	try {
		const response = gameState.createBullet(playerId)
		if (!response.success) {
			return getIO().to(socketId).emit('stateUpdateResponse', {  //emit
				type: 'error',
				message: response.message
			})
		}
		
		getIO().to(socketId).emit('stateUpdateResponse', {               //emit
			type: 'success',
			message: response.message,
		})

	} catch (err) {
		console.error(err)
		getIO().to(socketId).emit('stateUpdateResponse', {            //emit
			type: 'error',
			message: 'An error occurred while creating the bullet.'
		});
	}
}



module.exports = {
    joinRoom,
	startMatch,
	removePlayer,
	removePlayerBySocketId,
	movePlayer,
	createBullet
}
