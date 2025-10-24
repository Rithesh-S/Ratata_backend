const dbModel = require("../model/dbModel")
const { v4: uuidv4 } = require("uuid");
const gameState = require("../utils/gameStateSingleton")
const { generateArena } = require('../utils/arenaGenerator')

async function createArena(req,res) {
    const user = req.user
    const data = req.body
    const arenaSize = 33
    try {
        const usersCollection = await dbModel.getUsersCollection()
        const existingUser = await usersCollection.findOne({ userId: user.userId })

        if(!existingUser) return res.status(400).json({ message: "User not found!" })
        if(!data) return res.status(400).json({ message: "Meta Data not found!" })
        if(!data.spawnCount || data.spawnCount > 6 || data.spawnCount <= 1) return res.status(400).json({ message: "Exceeded SpawnCount Limit!" })

        const arenaMetaData = generateArena({
          size: arenaSize,
          spawnCount: data.spawnCount,
          fillPercent: 0.47,
          simulationSteps: 17
        })
        if(!arenaMetaData) return res.status(400).json({ message: "Arena Generation Failed!" })

        const commonMatchId = gameState.createMatch(arenaMetaData,user.userId)
        return res.status(201).json({ message: "The Match created successfully!", roomCode: commonMatchId })
    } catch (error) {
        console.error("Error Creating Arena: ", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

async function getLiveGameData(req,res) {
    const user = req.user
    const commonMatchId = req.params?.id
    try {
        const usersCollection = await dbModel.getUsersCollection()
        const existingUser = await usersCollection.findOne({ userId: user.userId })

        if(!existingUser) return res.status(400).json({ message: "User not found!" })
        if(!commonMatchId) return res.status(400).json({ message: "Meta Data not found!" })

        const gameData = gameState.getMatchByCommonId(commonMatchId)
        if(!gameData.success) return res.status(404).json({ message: gameData.message})

        return res.status(200).json({ message: "The Match Data fetched successfully!", gameData: gameData.response })

    } catch (error) {
        console.error("Error Fetching Game Data : ", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

// async function addGameStats(commonMatchId) {
//   try {
//     if (!commonMatchId) return

//     const gameData = gameState.getMatchByCommonId(commonMatchId);
//     if (!gameData.success) return

//     const match = gameData.response;

//     const historyCollection = await dbModel.getMatchHistoryCollection();
//     const playerStatsCollection = await dbModel.getPlayerStatsCollection();

//     const matchId = uuidv4();

//     await historyCollection.insertOne({
//       matchId,
//       commonMatchId: match.commonMatchId,
//       createdBy: match.createdBy,
//       createdAt: match.createdAt,
//       lastActivity: match.lastActivity,
//       status: "completed"
//     });

//     const playerDocs = Object.values(match.players).map(player => ({
//       matchId,
//       playerId: player.playerId,
//       userName: player.userName,
//       score: player.score,
//       kills: player.kills || 0,        
//       spawnCount: player.spawnCount || 0
//     }));

//     if (playerDocs.length > 0) {
//       await playerStatsCollection.insertMany(playerDocs);
//     }

//     return

//   } catch (error) {
//     console.error("Error Storing Game Stats:", error);
//     return
//   }
// }


module.exports = {
    createArena,
    getLiveGameData,
    // addGameStats
}