require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes')
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes')
const createSocketServer = require('./createSocketServer');
const http = require('http');

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions)); 

app.use('/auth', authRoutes)
app.use('/game', gameRoutes)
app.use('/user', userRoutes)

const PORT = process.env.PORT || 5060;

const server = createSocketServer(app, corsOptions);

server.listen(PORT, () => {
  console.log(`Server and sockets running on port ${PORT}...`);
});