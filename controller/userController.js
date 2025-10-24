const dbModel = require('../model/dbModel')

async function updateUserName(req, res) {
    const user = req.user
    const { userName } = req.body
    try {
        const usersCollection = await dbModel.getUsersCollection()
        const existingUser = await usersCollection.findOne({ userId: user.userId })
        if (!existingUser) return res.status(400).json({ message: "Not Found" })
        
        await usersCollection.updateOne(
            { userId: user.userId },
            { $set: { 
                userName ,
                updatedAt: new Date()
            } }
        )
        res.status(200).json({ message: "Updated successful" })
    } catch (error) {
        console.error("Error Updating Username:", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

async function getPlayerStats(req, res) {
  const { userId: playerId } = req.user;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const playerStatsCollection = await dbModel.getPlayerStatsCollection()
    const matchHistoryCollection = await dbModel.getMatchHistoryCollection()

    const playerMatchDocs = await playerStatsCollection
      .find({ playerId }, { matchId: 1, _id: 0 })
      .toArray();

    const matchIds = playerMatchDocs.map(doc => doc.matchId);

    const matches = await matchHistoryCollection
      .find(
        { matchId: { $in: matchIds } },
        {
          matchId: 1,
          commonMatchId: 1,
          createdBy: 1,
          createdAt: 1,
          lastActivity: 1,
          status: 1
        }
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalMatches = await matchHistoryCollection
      .countDocuments({ matchId: { $in: matchIds } });

    return res.json({
      playerId,
      totalMatches,
      page,
      limit,
      matches
    });

  } catch (err) {
    console.error("Error fetching player stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAggregatedPlayerStats(req, res) {
  const { userId: playerId } = req.user;
  try {
    const playerStatsCollection = await dbModel.getPlayerStatsCollection()
    const matchHistoryCollection = await dbModel.getMatchHistoryCollection()

    const playerStats = await playerStatsCollection
      .find({ playerId })
      .toArray()

    if (!playerStats || playerStats.length === 0) {
      return res.status(404).json({ error: "No stats found for this player" });
    }

    const totalMatches = playerStats.length;
    const totalKills = playerStats.reduce((acc, s) => acc + (s.kills || 0), 0);
    const totalDeaths = playerStats.reduce((acc, s) => acc + (s.spawnCount || 0), 0); 
    const totalScore = playerStats.reduce((acc, s) => acc + (s.score || 0), 0);

    const matchIds = playerStats.map(s => s.matchId);
    const matches = await matchHistoryCollection
      .find({ matchId: { $in: matchIds } })
      .toArray();

    let winCount = 0;
    let loseCount = 0;

    for (const match of matches) {
      const playerEntry = playerStats.find(s => s.matchId === match.matchId);

      if (!playerEntry) continue;

      const matchPlayers = await playerStatsCollection
        .find({ matchId: match.matchId })
        .toArray();

      const topScore = Math.max(...matchPlayers.map(p => p.score || 0));

      if (playerEntry.score === topScore) {
        winCount++;
      } else {
        loseCount++;
      }
    }

    res.json({
      totalMatches,
      totalKills,
      totalDeaths,
      totalScore,
      winCount,
      loseCount,
    });

  } catch (err) {
    console.error("Error fetching aggregated stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
    updateUserName,
    getPlayerStats,
    getAggregatedPlayerStats
}