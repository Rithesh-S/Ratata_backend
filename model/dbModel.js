const { connectToDatabase } = require("../utils/db")

async function getUsersCollection() {
    const { db } = await connectToDatabase()
    return db.collection("Users")
}

async function getMatchHistoryCollection() {
    const { db } = await connectToDatabase()
    return db.collection("History")
}
async function getPlayerStatsCollection() {
    const { db } = await connectToDatabase()
    return db.collection("Stats")
}

module.exports = { 
    getUsersCollection,
    getMatchHistoryCollection,
    getPlayerStatsCollection
}