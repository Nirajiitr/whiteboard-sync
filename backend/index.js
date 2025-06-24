import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import job from './lib/cron.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
job.start();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

const emitUserCount = (roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  const count = room ? room.size : 0;
  io.to(roomId).emit('userCount', { count });
};

const emitUserList = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  io.to(roomId).emit('userList', users);
};

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('createRoom', (roomConfig, callback) => {
    const { roomId, name, access, adminName, maxUsers, permissions } = roomConfig;

    if (rooms.has(roomId)) {
      return callback({ success: false, message: 'Room ID already exists.' });
    }

    rooms.set(roomId, {
      name,
      access,
      adminName,
      maxUsers,
      permissions,
      createdAt: new Date().toISOString(),
      users: new Map(), 
    });

    socket.join(roomId);
    rooms.get(roomId).users.set(socket.id, adminName); 
    console.log(`🏗️ Room created: ${roomId} by ${adminName}`);
    emitUserCount(roomId);
    emitUserList(roomId);

    callback({ success: true });
  });

  socket.on('joinRoom', (roomData, callback) => {
    const { userName, roomId } = roomData;

    if (!roomId || !userName) {
      return callback({ success: false, message: 'Room ID and user name are required.' });
    }

    if (!rooms.has(roomId)) {
      return callback({ success: false, message: 'Room does not exist.' });
    }

    const room = rooms.get(roomId);
    const currentRoom = io.sockets.adapter.rooms.get(roomId);
    const currentSize = currentRoom ? currentRoom.size : 0;

    if (room.maxUsers && currentSize >= room.maxUsers) {
      return callback({ success: false, message: 'Room is full.' });
    }

    socket.join(roomId);
    room.users.set(socket.id, userName);

    console.log(`✅ ${userName} (${socket.id}) joined room ${roomId}`);
    emitUserCount(roomId);
    emitUserList(roomId);

    callback({ success: true });
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if (room) {
      room.users.delete(socket.id);
      emitUserCount(roomId);
      emitUserList(roomId);
    }
    console.log(`👋 ${socket.id} left room ${roomId}`);
  });

  socket.on('drawing', (data) => {
    if (!data.roomId) return;
    socket.to(data.roomId).emit('drawing', data);
  });

  socket.on('shape', (data) => {
    if (!data.roomId) return;
    socket.to(data.roomId).emit('shape', data);
  });

  socket.on('clear', (roomId) => {
    if (!roomId) return;
    socket.to(roomId).emit('clear');
  });

  socket.on('chatMessage', (msg) => {
    const { roomId, text } = msg;
    const room = rooms.get(roomId);
    const userName = room?.users.get(socket.id);

    if (!roomId || !userName) return;

    io.to(roomId).emit('chatMessage', {
      userId: socket.id,
      userName,
      text,
      timestamp: new Date().toISOString(),
    });
  });
  

  socket.on('disconnecting', () => {
    const joinedRooms = [...socket.rooms].filter((r) => r !== socket.id);
    joinedRooms.forEach((roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.users.delete(socket.id);
        setTimeout(() => {
          emitUserCount(roomId);
          emitUserList(roomId);
        }, 100);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

app.get('/', (req, res) => {
  res.send('✅ Server is running');
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
