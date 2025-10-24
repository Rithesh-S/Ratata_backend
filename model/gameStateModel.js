const generateRandomNumber = require('../utils/randomNumberGenerator');
const { getIO } = require('../socket');
const { v4: uuidv4 } = require("uuid");
const dbModel = require("../model/dbModel");
const { randomSpawnAssigner } = require('../utils/arenaGenerator');
const Bullet = require('./bulletModel');
const remapPlayersBySocketId = require('../utils/reMapBySocketId');

const DIRECTIONS = Object.freeze({
	UP: [0, -1],
	DOWN: [0, 1],
	LEFT: [-1, 0],
	RIGHT: [1, 0],
});

// {
//   "matches" : {
//     "matchId" : {
//       "map" : {
//         "spawnCount" : "<integer>",
//         "arena" : "<array integer>",
//         "spawns" : "<array string>"
//       },
//       "players": {
//         "playerId": {
//           "playerId": "<string>", 
//           "socketId": "<string>",
//           "userName": "<string>",
//           "spawnCount": "<integer>",
//           "kills": "<integer>",
//           "health": "<integer>",
//           "score": "<integer>",
//           "position" : {
//             "x" : "<integer>",
//             "y" : "<integer>"
//           },
//           "direction": "<string>",
//           "status": "<string>"
//         }
//       },
//       "bullets" : {
//         "bulletId" : {
//           "bulletId": "<string>",
//           "playerId": "<string>",
//           "position" : {
//             "x" : "<integer>",
//             "y" : "<integer>"
//           },
//           "direction": "<string>",
//           "speed": "<integer>"
//         }
//       }
//       "commonMatchId": "<string>",
//       "status": "<string>",
//       "createdBy": "<string>",
//       "lastActivity": <date>,
//       "createdAt": <date>,
//     }
//   },
//   "players" : {
//     "playerId": {
//       "matchId": "<string>",
//       "socketId": "<string>"
//     }
//   },
//   "matchMapping" : {
//     "commonMatchId" : "matchId"
//   }
// }

class GameState {
	constructor() {
		this.matches = {}        // internalId => match object
		this.players = {}        // playerId => { matchId, socketId }
		this.matchMapping = {}   // commonMatchId => matchId

		this.bulletDamage = 20
    this.damageScore = 20
    this.killScore = 100
		this.respawnTimeout = 15 * 1000 // milliseconds
		this.waitingMatchTimeout = 5 * 60 * 1000 // milliseconds
		this.activeMatchTimeout = 7 * 60 * 1000 // milliseconds

		setInterval(() => {
			const now = Date.now()
			for (const commonMatchId in this.matchMapping) {
        const matchId = this.matchMapping[commonMatchId]
				const match = this.matches[matchId]
				if (now - match.lastActivity > this.waitingMatchTimeout
					&& match.status === 'waiting' 
					&& Object.keys(match.players).length === 0) {
					console.log(`Auto-deleting inactive match ${matchId}`)          //console.log
					this.deleteMatch(commonMatchId)
				}
			}
		}, 60 * 1000) // 60 seconds
    
    setInterval(() => {
      const matchIds = Object.keys(this.matches)
      matchIds.forEach(matchId => {
        this.updateMatchState(matchId)
        if(this.matches[matchId].status !== 'waiting') {
          getIO().to(matchId).emit("stateUpdate", {
            map: this.matches[matchId].map.arena,
            players: remapPlayersBySocketId(this.matches[matchId].players),
            bullets: this.matches[matchId].bullets,
            status: this.matches[matchId].status,
            timeLeft: this.activeMatchTimeout - (Date.now() - this.matches[matchId].lastActivity)
          })
        } else {
          getIO().to(matchId).emit("stateUpdate", {
            spawnCount: this.matches[matchId].map.spawnCount,
            players: Object.values(this.matches[matchId].players).map(p => ({
              userName: p.userName,
              status: p.status,
            })),
            status: this.matches[matchId].status,
            createdBy: this.players[this.matches[matchId].createdBy]?.socketId,
            timeLeft: this.waitingMatchTimeout - (Date.now() - this.matches[matchId].lastActivity)
          })
        }
      })
    }, 100)  // server tick (10 - 20 ticks / s)
  }

  
	createMatch(mapData,userData) {
		const matchId = uuidv4()
		const commonMatchId = generateRandomNumber(6).toString()
		this.matches[matchId] = {
      map: mapData,
			players: {},     // playerId => playerData
			bullets: {},
			commonMatchId,
			status: 'waiting',
      createdBy: userData,
			lastActivity: Date.now(),
			createdAt: Date.now(),
		};
		this.matchMapping[commonMatchId] = matchId

		return commonMatchId
	}
  
	async deleteMatch(commonMatchId) {
    const matchId = this.matchMapping[commonMatchId]
		if(matchId) {
      if (this.matches[matchId]?.timeoutId) clearTimeout(this.matches[matchId]?.timeoutId)
      if (getIO().sockets.adapter.rooms.has(matchId)) {
        getIO().to(matchId).emit('matchDeleted', { message: `The room ${commonMatchId} has been closed` }) //emit
        await getIO().in(matchId).socketsLeave(matchId)
      }
			delete this.matches[matchId]
			delete this.matchMapping[commonMatchId]

			for (const playerId in this.players) {
				if (this.players[playerId].matchId === matchId) {
          delete this.players[playerId]
				}
			}
		}
    console.log("After Deletion:",this.matches)           //console.log
    console.log("After Deletion:",this.matchMapping)      //console.log
    console.log("After Deletion:",this.players)           //console.log
	}
  
	startMatch(commonMatchId,playerId) {
    const matchId = this.matchMapping[commonMatchId]
    const match = this.matches[matchId]

    if (!match) { 
      return {
        success: false,
        message: "The room doesn't exists"
      } 
    }
    if (match.status !== 'waiting') {
      return {
        success: false,
        message: "Room has already started"
      }
    }
    if(Object.keys(match.players).length === 1) {
      return {
        success: false,
        message: "Minimum of 2 player is required to start the match"
      }
    }
    if(match.createdBy !== playerId) {
      return {
        success: false,
        message: "Room creator should start the match"
      }
    }
    if(!(playerId in match.players)) {
      return {
        success: false,
        message: "Join the room to start the match"
      }
    }

    match.players = randomSpawnAssigner(match.players,match.map.spawns)

    match.status = 'active'
    match.lastActivity = Date.now()

    match.timeoutId = setTimeout(async () => {
      try {
        const now = Date.now()
        if (match && now - match.lastActivity >= this.activeMatchTimeout && match.status === 'active') {
          console.log(`Match Completed: ${matchId}`)
          await this.addGameStats(commonMatchId)
          this.deleteMatch(commonMatchId)
        }
      } catch (err) {
        console.error("Error finalizing match:", err)
      }
    }, this.activeMatchTimeout)

    return {
      success: true,
      message: "The room is started"
    }
	}
  
	addPlayerToMatch(commonMatchId, playerData) {
    const matchId = this.matchMapping[commonMatchId];
    const match = this.matches[matchId];

    if (!match) {
      return {
        success: false,
        message: `The match ${commonMatchId} doesn't exists`
      }
    }

    const existingMatchPlayer = match.players[playerData.playerId];
    const existingGlobalPlayer = this.players[playerData.playerId];

    if (existingGlobalPlayer && existingGlobalPlayer?.matchId !== matchId) {
      return {
        success: false,
        message: "Already in a room"
      };
    }

    if (existingMatchPlayer && existingGlobalPlayer && existingGlobalPlayer.matchId === matchId) {
      existingMatchPlayer.socketId = playerData.socketId;
      existingMatchPlayer.status = 'alive';
      existingGlobalPlayer.socketId = playerData.socketId;
      return {
        success: true,
        message: `${playerData.userName} connected to the room`
      };
    }

    if(Object.keys(match.players).length === match.map.spawnCount) {
      return {
        success: false,
        message: "The room is full"
      }
    }

    match.players[playerData.playerId] = playerData;
    this.players[playerData.playerId] = {
      matchId,
      socketId: playerData.socketId
    };

    if (Object.keys(match.players).length === 1) {
      match.lastActivity = Date.now();

      if (match.cleanupTimer) clearTimeout(match.cleanupTimer);

      match.cleanupTimer = setTimeout(() => {
        const now = Date.now();
        const stillMatch = this.matches[matchId];
        if (
          stillMatch &&
          now - stillMatch.lastActivity >= this.waitingMatchTimeout &&
          stillMatch.status === 'waiting' &&
          Object.keys(stillMatch.players).length > 0
        ) {
          console.log(`Auto-deleting inactive match ${matchId}`);
          this.deleteMatch(commonMatchId);
        }
      }, this.waitingMatchTimeout);
    }

    return {
      success: true,
      message: `${playerData.userName} joined the room`
    };
  }


  removePlayer(playerId) {
    const info = this.players[playerId]
    if (!info) return false

    const match = this.matches[info.matchId]
    const userName = match.players[playerId]?.userName || 'Unknown Player'
    if (match && match.players[playerId]) delete match.players[playerId]
    delete this.players[playerId]

    return userName
  }

  removePlayerBySocketId(socketId) {
    for (const [playerId, pInfo] of Object.entries(this.players)) {
      if (pInfo.socketId !== socketId) continue

      const match = this.matches[pInfo.matchId]
      if (!match || !match.players[playerId]) {
        return { success: false, reason: "Match or player not found" }
      }

      const { matchId } = pInfo
      const { commonMatchId } = match

      // Mark player as disconnected
      match.players[playerId].socketId = null
      match.players[playerId].status = "disconnected"
      pInfo.socketId = null

      return {
        success: true,
        data: { userName: match.players[playerId].userName, matchId }
      }
    }
    return { success: false, reason: "Socket not found" }
  }

  getMatchByCommonId(commonMatchId) {
    const matchId = this.matchMapping[commonMatchId];
    if(!matchId) 
      return {
        success: false,
        message: "Match doesn't exist"
    }
    const { cleanupTimer , ...matchData } = this.matches[matchId]
    return {
      success: true,
      response: matchData
    }
  }
  
  updatePlayerPosition(playerId, dir) {
    const playerInfo = this.players[playerId]
    if (!playerInfo) return {
      success: false,
      message: "Player doesn't exists"
    }

    const match = this.matches[playerInfo.matchId]
    const player = match?.players[playerId]
    if (!player) return {
      success: false,
      message: "Player doesn't exists"
    }

    const move = DIRECTIONS[dir.toUpperCase()]
    if (!move) return {
      success: false,
      message: "Invalid Move"
    }

    if(player.status !== 'alive') {
      return {
        success: false,
        message: "Player is not alive"
      }
    }

    const newX = player.position.x + move[0]
    const newY = player.position.y + move[1]

    if (match.map.arena[newY] && match.map.arena[newY][newX] === 0) {
      player.position.x = newX
      player.position.y = newY
      player.direction = dir
      return {
        success: true,
        message: "Updated successfully"
      }
    }
    return {
      success: true,
      message: "Wall detected"
    }
  }
  
  createBullet(playerId) {
    const { matchId } = this.players[playerId]
    const match = this.matches[matchId];
    if(!match) return {
      success: false,
      message: "Match not found"
    }
    const player = match.players[playerId]
    if(!player) return {
      success: false,
      message: "Player not found in the match"
    }

		const bulletId = uuidv4()
		const bulletData = new Bullet(
			{
			  playerId,
        bulletId,
				x: player.position.x,
				y: player.position.y,
				direction: player.direction,
				speed: 1
			})

    match.bullets[bulletId] = bulletData;  
    return {
      success: true,
      message: "Created Successfull"
    }
  }

  updateMatchState(matchId) {                         //yet to test
    const match = this.matches[matchId]
    if (!match || match.status !== 'active') return

    const hits = new Map()

    for (const bulletId in match.bullets) {
      const bullet = match.bullets[bulletId]
      if(bullet.direction.toUpperCase() === 'UP') {
        bullet.position.y -= bullet.speed
      } else if(bullet.direction.toUpperCase() === 'DOWN') {
        bullet.position.y += bullet.speed
      } else if(bullet.direction.toUpperCase() === 'LEFT') {
        bullet.position.x -= bullet.speed
      } else if(bullet.direction.toUpperCase() === 'RIGHT') {
        bullet.position.x += bullet.speed
      }

      const bx = bullet.position.x
      const by = bullet.position.y
      const arena = match.map.arena; 

      if (
          !arena[by] ||
          arena[by][bx] === undefined ||
          arena[by][bx] === 1
      ) {
          delete match.bullets[bulletId]
          continue; 
      }

      for (const playerId in match.players) {
        if (bullet.playerId === playerId) continue;
        const player = match.players[playerId];
        if (player.status !== 'dead' && player.position.x === bx && player.position.y === by) {
          const bulletPlayerId = bullet.playerId
          const bulletPlayer = match.players[bulletPlayerId]

          bulletPlayer.score += this.damageScore

          const prev = hits.get(playerId) || 0
          hits.set(playerId, prev + this.bulletDamage)

          if (player.health - (prev + this.bulletDamage) <= 0) {
            bulletPlayer.kills += 1 
            bulletPlayer.score += this.killScore
          }

          delete match.bullets[bulletId];
          break;
        }
      }
    }

    for (const [playerId, damage] of hits) {
      const player = match.players[playerId]
      if (player) {
        player.health = Math.max(0, player.health - damage)

        if (player.health === 0) {
          player.status = "dead"

          getIO().to(matchId).emit("stateUpdateInfo", {
            message: `${player.userName} is dead`
          })

          setTimeout(() => {
            if (match.players[playerId]) {
              match.players[playerId].status = "alive"
              match.players[playerId].health = 100
              getIO().to(matchId).emit("stateUpdateInfo", {
                message: `${player.userName} is respawned`
              })
            }
          }, this.respawnTimeout)
        }
      }
    }
  }

  async addGameStats(commonMatchId) {
    try {
      if (!commonMatchId) return;
      const gameData = this.getMatchByCommonId(commonMatchId);
      if (!gameData.success) return;

      const match = gameData.response;

      const historyCollection = await dbModel.getMatchHistoryCollection();
      const playerStatsCollection = await dbModel.getPlayerStatsCollection();

      const matchId = uuidv4();

      await historyCollection.insertOne({
        matchId,
        commonMatchId: match.commonMatchId,
        createdBy: match.createdBy,
        createdAt: match.createdAt,
        lastActivity: match.lastActivity,
        status: "completed",
      });

      const playerDocs = Object.values(match.players).map((player) => ({
        matchId,
        playerId: player.playerId,
        userName: player.userName,
        score: player.score,
        kills: player.kills || 0,
        spawnCount: player.spawnCount || 0,
      }));

      if (playerDocs.length > 0) {
        await playerStatsCollection.insertMany(playerDocs);
      }

      return;
    } catch (error) {
      console.error("Error Storing Game Stats:", error);
      return;
    }
  }
}

module.exports = GameState;
