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
    origin: "*",
    methods: ["POST", "GET"],
  },
});

const emitUserCount = (roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  const count = room ? room.size : 0;
  io.to(roomId).emit("userCount", { count });
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId, callback) => {
  try {
    socket.join(roomId);
    callback({ success: true });
    emitUserCount(roomId);
  } catch (err) {
    callback({ success: false, message: err.message });
  }
});

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`${socket.id} left room ${roomId}`);
    emitUserCount(roomId);
  });

  socket.on("drawing", (data) => {
    if (!data.roomId) return;
    socket.to(data.roomId).emit("drawing", data);
  });

  socket.on("shape", (data) => {
    if (!data.roomId) return;
    socket.to(data.roomId).emit("shape", data);
  });

  socket.on("clear", (roomId) => {
    if (!roomId) return;
    socket.to(roomId).emit("clear");
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      console.log(`${socket.id} disconnecting from room ${roomId}`);
      setTimeout(() => emitUserCount(roomId), 100); 
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
  socket.on("chatMessage", (msg ) => {
    const roomId = msg.roomId;
    if (!roomId) return;
  
    socket.to(roomId).emit("chatMessage", {
      userId: socket.id,
      text: msg.text,
      timestamp: new Date().toISOString(),
    });
  });

});

 
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
