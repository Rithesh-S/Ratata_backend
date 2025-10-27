# Ratata (Backend)

This is the backend server for **Ratata**, a real-time multiplayer 2D shooter game.

This server is built with **Node.js** and **Express.js**, using **Socket.IO** for real-time WebSocket communication. It features a robust in-memory game state management system, procedural arena generation, and a REST API for user authentication and match management.

The frontend for this project can be found here: [Rithesh-S/Ratata\_frontend](https://github.com/Rithesh-S/Ratata_frontend)

-----

## ✨ Features

### Core Gameplay

  * **Real-time Multiplayer:** Uses Socket.IO to manage all player interactions in real-time.
  * **Server-Side Game Loop:** A central `GameState` singleton runs a game loop (via `setInterval`) to process bullet movement, detect collisions, and broadcast the updated state to all clients.
  * **In-Memory State:** All active match data (player positions, bullets, scores) is held in memory for high-speed access, managed by the `GameState` singleton.
  * **Player Actions:** Handles player movement (grid-based), shooting, and state (alive, dead, disconnected).
  * **Game Logic:** Server-side calculation of damage, kills, scores, and player respawns after a timeout.
  * **Match Lifecycle:** Manages the full lifecycle of a match:
      * `waiting`: Players can join.
      * `active`: Game is in progress.
      * `completed`: Stats are saved, and the match is cleaned up from memory.
  * **Automatic Cleanup:** Inactive waiting rooms and completed matches are automatically purged from memory.

### Arena & User Features

  * **Procedural Arena Generation:** Uses a **Cellular Automata** algorithm (`arenaGenerator.js`) to create unique, cave-like arenas for each match. This generator ensures the entire map is a single, connected region, guaranteeing fair and playable maps.
  * **REST API:** Provides secure endpoints for user authentication, match creation, and fetching game history.
  * **User Authentication:** Uses **JSON Web Tokens (JWT)** for secure user signup, login, and API route protection.
  * **Persistent Stats:** At the end of each match, player scores, kills, and match history are saved to a **MongoDB** database.
  * **Player Statistics:** API endpoints are available to retrieve a player's full match history and aggregated stats (total kills, deaths, W/L ratio, etc.).

-----

## 🛠️ Tech Stack

  * **Runtime:** Node.js
  * **Server:** Express.js
  * **Real-time:** Socket.IO
  * **Database:** MongoDB
  * **Authentication:** JSON Web Tokens (JWT)
  * **Validation:** Joi (inferred from `middleware/validator`)
  * **Password Hashing:** bcrypt (inferred from `utils/hasher`)

-----

## 🚀 Getting Started

### 1\. Prerequisites

  * [Node.js](https://nodejs.org/) (v18 or later)
  * [MongoDB](https://www.mongodb.com/try/download/community) (running local instance or a cloud URI)

### 2\. Clone the Repository

```sh
git clone https://github.com/Rithesh-S/Ratata_backend.git
cd Ratata_backend
```

### 3\. Install Dependencies

```sh
npm install
```

### 4\. Set Up Environment Variables

Create a file named `.env` in the root of the project. Add the following required variables:

```.env
# Port for the server
PORT=8080

# Your MongoDB connection string
MONGO_URI=mongodb://localhost:27017/ratata

# Secret key for signing JSON Web Tokens
JWT_SECRET=your_super_secret_jwt_key_here

# The origin URL of your frontend (for
CORS_ORIGIN=http://localhost:5173
```

### 5\. Run the Server

To run the server with automatic restarting on file changes (recommended for development):

```sh
npm run dev
```

To run the server in production:

```sh
npm start
```

The server will be running on the port specified in your `.env` file.

-----

## 🔌 API Endpoints (REST)

All API routes are protected with JWT authentication unless specified otherwise.

### Authentication (`/api/auth`)

  * **`POST /api/auth/signup`** (Public)

      * Registers a new user.
      * **Body:** `{ "userName": "...", "email": "...", "password": "..." }`

  * **`GET /api/auth/login`** (Public)

      * Logs in an existing user.
      * **Query:** `?email=...&password=...`
      * **Response:** `{ "message": "Login successful", "userName": "...", "email": "...", "token": "..." }`

### User (`/api/user`)

  * **`PUT /api/user/profile/update`**

      * Updates the authenticated user's username.
      * **Body:** `{ "userName": "new_username" }`

  * **`GET /api/user/history`**

      * Gets a paginated list of the user's completed matches.
      * **Query:** `?page=1&limit=10`

  * **`GET /api/user/stats`**

      * Gets aggregated stats for the user (total kills, deaths, score, wins, losses).

### Game (`/api/game`)

  * **`POST /api/game/match/create`**

      * Creates a new game match, generates an arena, and stores it in the `GameState`.
      * **Body:** `{ "spawnCount": 4 }` (Number of players, min 2, max 6)
      * **Response:** `{ "message": "The Match created successfully!", "roomCode": "123456" }`

  * **`GET /api/game/match/:id/data`**

      * Fetches the current live data for a specific match by its `roomCode` (commonMatchId).
      * **Params:** `:id` is the `roomCode` (e.g., `123456`).
      * **Response:** `{ "message": "...", "gameData": { ... } }`

-----

## 📡 Socket.IO Events

The server uses Socket.IO for all real-time game communication.

### Client to Server

  * **`joinRoom`**

      * The client requests to join a specific match.
      * **Data:** `{ "roomId": "123456", "userName": "..." }`

  * **`startMatch`**

      * The room creator requests to start the match.
      * **Data:** `{ "roomId": "123456" }`

  * **`movePlayer`**

      * The client sends its movement input.
      * **Data:** `{ "dir": "up" | "down" | "left" | "right" }`

  * **`createBullet`**

      * The client informs the server it has fired a bullet. The server creates the bullet object.
      * **Data:** `{}` (No data needed, server uses player's current state)

  * **`removePlayer`**

      * The client informs the server it is leaving the room.
      * **Data:** `{ "roomId": "123456" }`

  * **`disconnect`** (Built-in)

      * Fired when a user disconnects. The server handles this by marking the player as "disconnected" and removing them from the match.

### Server to Client

  * **`roomResponse`**

      * Sent as a direct response to `joinRoom`, `startMatch`, or `removePlayer` to indicate success or failure.
      * **Data:** `{ "type": "success" | "error", "message": "..." }`

  * **`stateUpdateResponse`**

      * Sent as a direct response to `movePlayer` or `createBullet`.
      * **Data:** `{ "type": "success" | "error", "message": "..." }`

  * **`stateUpdate`**

      * This is the **main game loop broadcast**. It is sent to all clients in a room every tick (e.g., 100ms) with the complete current game state.
      * **Data (Waiting Status):** `{ "spawnCount": 4, "players": [ ... ], "status": "waiting", "createdBy": "...", "timeLeft": ... }`
      * **Data (Active Status):** `{ "map": [ ... ], "players": { ... }, "bullets": { ... }, "status": "active", "timeLeft": ... }`

  * **`stateUpdateInfo`**

      * Sent to all clients in a room to announce a specific event (like a player death or respawn).
      * **Data:** `{ "message": "Player 'Ratata' is dead" }`

  * **`matchDeleted`**

      * Sent to all clients in a room when the match is over and has been deleted from the server.
      * **Data:** `{ "message": "The room 123456 has been closed" }`

-----

## 🧠 Core Concepts

### 1\. GameState Singleton

The entire live functionality of the game is powered by a singleton class `GameState`. A single instance of this class is created when the server starts and is imported by all controllers.

  * **`matches`**: An object holding all active match data, keyed by a `matchId` (UUID).
  * **`players`**: A lookup map holding player IDs and which `matchId` they are in.
  * **`matchMapping`**: A lookup map to convert the user-friendly `roomCode` (e.g., "123456") to the internal `matchId`.

This class also contains the main **game loop** (`setInterval`). Every `100ms`, this loop iterates over all active matches:

1.  Moves every bullet.
2.  Checks for bullet-wall collisions (deleting the bullet).
3.  Checks for bullet-player collisions.
4.  Calculates damage, updates health, and assigns scores/kills.
5.  Updates player statuses (e.g., to "dead").
6.  Handles respawn timers.
7.  Broadcasts the new, complete state (`stateUpdate`) to all clients in that match.

### 2\. In-Memory State Structure

The `GameState.matches` object holds all match data in a structure that looks like this:

```json
{
  "matches": {
    "matchId-uuid-123": {
      "map": {
        "spawnCount": 4,
        "arena": [ [1, 1, 1], [1, 0, 1], [1, 1, 1] ],
        "spawns": [ [1, 2], [5, 6], [8, 2], [4, 8] ]
      },
      "players": {
        "playerId-abc": {
          "playerId": "playerId-abc",
          "socketId": "socketId-xyz",
          "userName": "Ratata",
          "health": 100,
          "score": 0,
          "kills": 0,
          "position": { "x": 1, "y": 2 },
          "direction": "up",
          "status": "alive"
        }
      },
      "bullets": {
        "bulletId-uuid-789": {
          "bulletId": "bulletId-uuid-789",
          "playerId": "playerId-abc",
          "position": { "x": 1, "y": 3 },
          "direction": "up",
          "speed": 1
        }
      },
      "commonMatchId": "123456",
      "status": "active",
      "createdBy": "playerId-abc",
      "lastActivity": 1678886400000,
      "createdAt": 1678886000000
    }
  }
}
```
