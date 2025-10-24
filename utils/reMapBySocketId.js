function remapPlayersBySocketId(players) {
  const newPlayers = {};

  for (const playerId in players) {
    if (players.hasOwnProperty(playerId)) {
      const { playerId: _, socketId, ...rest } = players[playerId]; 
      newPlayers[socketId] = rest; 
    }
  }

  return newPlayers;
}

module.exports = remapPlayersBySocketId
