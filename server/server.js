const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

const cors = require('cors');
const axios = require('axios');
app.use(cors());
app.use(express.json());

// Quản lý phòng nghe chung WebSocket
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        if (rooms[roomId]) {
            socket.emit('sync-state', rooms[roomId]);
        }
    });

    socket.on('player-action', ({ roomId, action, data }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { currentSong: null, isPlaying: false, currentTime: 0 };
        }

        if (action === 'play') {
            rooms[roomId].isPlaying = true;
            rooms[roomId].currentSong = data.song;
        } else if (action === 'pause') {
            rooms[roomId].isPlaying = false;
        } else if (action === 'seek') {
            rooms[roomId].currentTime = data.currentTime;
        } else if (action === 'change-song') {
            rooms[roomId].currentSong = data.song;
            rooms[roomId].currentTime = 0;
        }

        socket.to(roomId).emit('remote-action', { action, data });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Music Server & Proxy running on port ${PORT}`);
});