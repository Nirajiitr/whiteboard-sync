import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import job from "./lib/cron.js";
import dotenv from "dotenv";
import connectDB from "./lib/database.js";
import Room from "./models/Room.js";
import Message from "./models/Message.js";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
connectDB();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.userSockets = new Map();
  }

  createRoom(roomId, roomConfig) {
    if (this.rooms.has(roomId)) {
      throw new Error("Room ID already exists");
    }

    const room = {
      ...roomConfig,
      createdAt: new Date().toISOString(),
      users: new Map(),
      drawingHistory: [],
      lastActivity: Date.now(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, socketId, userName) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room does not exist");
    }

    if (room.maxUsers && room.users.size >= room.maxUsers) {
      throw new Error("Room is full");
    }

    room.users.set(socketId, {
      name: userName,
      joinedAt: new Date().toISOString(),
    });

    this.userSockets.set(socketId, roomId);
    room.lastActivity = Date.now();

    return room;
  }

  leaveRoom(socketId) {
    const roomId = this.userSockets.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(socketId);
      room.lastActivity = Date.now();

      if (room.users.size === 0) {
        setTimeout(() => {
          const currentRoom = this.rooms.get(roomId);
          if (currentRoom && currentRoom.users.size === 0) {
            this.rooms.delete(roomId);
            console.log(`🧹 Cleaned up empty room: ${roomId}`);
          }
        }, 5 * 60 * 1000);
      }
    }

    this.userSockets.delete(socketId);
    return { roomId, room };
  }

  addDrawingCommand(roomId, command) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.drawingHistory.length > 2000) {
      room.drawingHistory = room.drawingHistory.slice(1000);
    }

    const historyCommand = {
      ...command,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    };

    room.drawingHistory.push(historyCommand);
    room.lastActivity = Date.now();
    
    return historyCommand;
  }

  getDrawingHistory(roomId) {
    const room = this.rooms.get(roomId);
    return room ? [...room.drawingHistory] : []; 
  }

  clearDrawingHistory(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.drawingHistory = [];
      room.lastActivity = Date.now();
    }
  }

  getRoomStats() {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.userSockets.size,
      activeRooms: Array.from(this.rooms.values()).filter(
        (room) => room.users.size > 0
      ).length,
    };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
}

const roomManager = new RoomManager();

const emitUserCount = (roomId) => {
  const room = roomManager.rooms.get(roomId);
  const count = room ? room.users.size : 0;
  io.to(roomId).emit("userCount", { count });
};

const emitUserList = (roomId) => {
  const room = roomManager.rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.entries()).map(([id, userData]) => ({
    id,
    name: userData.name,
    joinedAt: userData.joinedAt,
  }));

  io.to(roomId).emit("userList", users);
};

const validateRoomConfig = (config) => {
  const { roomId, name, adminName, maxUsers } = config;

  if (!roomId || roomId.length < 3 || roomId.length > 50) {
    throw new Error("Room ID must be between 3 and 50 characters");
  }

  if (!name || name.length > 100) {
    throw new Error("Room name must be provided and less than 100 characters");
  }

  if (!adminName || adminName.length > 50) {
    throw new Error("Admin name must be provided and less than 50 characters");
  }

  if (maxUsers && (maxUsers < 1 || maxUsers > 100)) {
    throw new Error("Max users must be between 1 and 100");
  }
};

const validateDrawingData = (data) => {
  if (!data || typeof data !== 'object') return false;
  
  if (data.from && data.to) {
    return (
      typeof data.from.x === 'number' && 
      typeof data.from.y === 'number' &&
      typeof data.to.x === 'number' && 
      typeof data.to.y === 'number' &&
      !isNaN(data.from.x) && !isNaN(data.from.y) &&
      !isNaN(data.to.x) && !isNaN(data.to.y)
    );
  }
  
  if (data.start && data.end) {
    return (
      typeof data.start.x === 'number' && 
      typeof data.start.y === 'number' &&
      typeof data.end.x === 'number' && 
      typeof data.end.y === 'number' &&
      !isNaN(data.start.x) && !isNaN(data.start.y) &&
      !isNaN(data.end.x) && !isNaN(data.end.y)
    );
  }
  
  return false;
};

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.emit("serverStats", roomManager.getRoomStats());

  socket.on("createRoom", async (roomConfig, callback) => {
    try {
      validateRoomConfig(roomConfig);

      const { roomId, name, access, adminName, maxUsers, permissions } =
        roomConfig;

      const room = roomManager.createRoom(roomId, {
        name,
        access,
        adminName,
        maxUsers,
        permissions,
      });

      try {
        await Room.create({
          roomId,
          name,
          access,
          adminName,
          maxUsers,
          permissions,
        });
      } catch (err) {
        console.error("❌ Failed to save room:", err.message);
      }

      socket.join(roomId);
      room.users.set(socket.id, {
        name: adminName,
        joinedAt: new Date().toISOString(),
      });
      roomManager.userSockets.set(socket.id, roomId);

      console.log(`🏗️ Room created: ${roomId} by ${adminName}`);

      emitUserCount(roomId);
      emitUserList(roomId);

      callback({
        success: true,
        roomData: { roomId, name, access, adminName, maxUsers, permissions },
        drawingHistory: [],
      });
    } catch (error) {
      console.error("❌ Create room error:", error.message);
      callback({ success: false, message: error.message });
    }
  });

  socket.on("joinRoom", async (roomData, callback) => {
    try {
      const { userName, roomId } = roomData;

      if (!roomId || !userName) {
        throw new Error("Room ID and user name are required");
      }

      if (userName.length > 50) {
        throw new Error("User name must be less than 50 characters");
      }

      const room = roomManager.joinRoom(roomId, socket.id, userName);
      socket.join(roomId);

      console.log(`✅ ${userName} (${socket.id}) joined room ${roomId}`);

      emitUserCount(roomId);
      emitUserList(roomId);

      const drawingHistory = roomManager.getDrawingHistory(roomId);

      callback({
        success: true,
        roomData: {
          roomId,
          name: room.name,
          access: room.access,
          adminName: room.adminName,
          maxUsers: room.maxUsers,
          permissions: room.permissions,
        },
        drawingHistory,
      });
    } catch (error) {
      console.error("❌ Join room error:", error.message);
      callback({ success: false, message: error.message });
    }
  });

  socket.on("rejoinRoom", async (roomData, callback) => {
    try {
      const { roomId, userName } = roomData;

      if (!roomId || !userName) {
        throw new Error("Room ID and user name are required for rejoining.");
      }

      const room = roomManager.getRoom(roomId);
      if (!room) {
        throw new Error("Room not found or expired.");
      }

      socket.join(roomId);
      room.users.set(socket.id, {
        name: userName,
        joinedAt: new Date().toISOString(),
      });
      roomManager.userSockets.set(socket.id, roomId);

      emitUserCount(roomId);
      emitUserList(roomId);

      const drawingHistory = roomManager.getDrawingHistory(roomId);

      callback({
        success: true,
        roomData: {
          roomId,
          name: room.name,
          access: room.access,
          adminName: room.adminName,
          maxUsers: room.maxUsers,
          permissions: room.permissions,
        },
        drawingHistory,
      });

      console.log(`🔁 ${userName} (${socket.id}) rejoined room ${roomId}`);
    } catch (error) {
      console.error("❌ Rejoin error:", error.message);
      callback({ success: false, message: error.message });
    }
  });

  socket.on("leaveRoom", (roomId) => {
    if (!roomId) return;

    socket.leave(roomId);
    const result = roomManager.leaveRoom(socket.id);

    if (result) {
      emitUserCount(roomId);
      emitUserList(roomId);
      console.log(`👋 ${socket.id} left room ${roomId}`);
    }
  });

  socket.on("drawing", (data) => {
    if (!data.roomId || !validateDrawingData(data)) {
      console.warn("❌ Invalid drawing data received:", data);
      return;
    }

    const userRoomId = roomManager.userSockets.get(socket.id);
    if (userRoomId !== data.roomId) {
      console.warn("❌ User not in specified room for drawing:", socket.id, data.roomId);
      return;
    }

    const historyCommand = roomManager.addDrawingCommand(data.roomId, {
      type: "drawing",
      from: data.from,
      to: data.to,
      color: data.color || "#000000",
      penSize: data.penSize || 3,
      isEraser: data.isEraser || false,
    });

    socket.to(data.roomId).emit("drawing", {
      ...data,
      commandId: historyCommand.id, 
    });
  });

  socket.on("shape", (data) => {
    if (!data.roomId || !validateDrawingData(data)) {
      console.warn("❌ Invalid shape data received:", data);
      return;
    }

    const userRoomId = roomManager.userSockets.get(socket.id);
    if (userRoomId !== data.roomId) {
      console.warn("❌ User not in specified room for shape:", socket.id, data.roomId);
      return;
    }

    const historyCommand = roomManager.addDrawingCommand(data.roomId, {
      type: "shape",
      start: data.start,
      end: data.end,
      color: data.color || "#000000",
      penSize: data.penSize || 3,
      tool: data.tool || "rectangle",
    });

    socket.to(data.roomId).emit("shape", {
      ...data,
      commandId: historyCommand.id,
    });
  });

  socket.on("clear", (roomId) => {
    if (!roomId) return;

    const userRoomId = roomManager.userSockets.get(socket.id);
    if (userRoomId !== roomId) {
      console.warn("❌ User not in specified room for clear:", socket.id, roomId);
      return;
    }

    roomManager.clearDrawingHistory(roomId);
    
    io.to(roomId).emit("clear");
    
    console.log(`🧹 Canvas cleared in room ${roomId} by ${socket.id}`);
  });

  socket.on("requestDrawingHistory", (roomId, callback) => {
    if (!roomId) {
      callback({ success: false, message: "Room ID required" });
      return;
    }

    const userRoomId = roomManager.userSockets.get(socket.id);
    if (userRoomId !== roomId) {
      callback({ success: false, message: "Not authorized for this room" });
      return;
    }

    const drawingHistory = roomManager.getDrawingHistory(roomId);
    callback({ success: true, drawingHistory });
  });

  socket.on("chatMessage", async (msg) => {
    try {
      const { roomId, text } = msg;

      if (!roomId || !text || text.trim().length === 0) return;
      if (text.length > 500) return;

      const room = roomManager.rooms.get(roomId);
      const userData = room?.users.get(socket.id);

      if (!room || !userData) return;

      const newMessage = {
        roomId,
        userName: userData.name,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      try {
        await Message.create(newMessage);
      } catch (err) {
        console.error("❌ Failed to save message:", err.message);
      }

      io.to(roomId).emit("chatMessage", {
        userId: socket.id,
        ...newMessage,
      });
    } catch (error) {
      console.error("❌ Chat message error:", error.message);
    }
  });

  socket.on("disconnecting", () => {
    const result = roomManager.leaveRoom(socket.id);

    if (result) {
      setTimeout(() => {
        emitUserCount(result.roomId);
        emitUserList(result.roomId);
      }, 100);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  socket.on("ping", (callback) => {
    callback("pong");
  });
});

app.get("/", (req, res) => {
  const stats = roomManager.getRoomStats();
  res.json({
    status: "✅ Server is running",
    ...stats,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .exec();

    res.json(messages.reverse());
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get("/api/rooms/:roomId/info", (req, res) => {
  const { roomId } = req.params;
  const room = roomManager.rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.json({
    roomId,
    name: room.name,
    access: room.access,
    userCount: room.users.size,
    maxUsers: room.maxUsers,
    createdAt: room.createdAt,
    lastActivity: new Date(room.lastActivity).toISOString(),
    drawingHistorySize: room.drawingHistory.length,
  });
});

app.get("/api/rooms/:roomId/drawing-history", (req, res) => {
  const { roomId } = req.params;
  const room = roomManager.rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.json({
    roomId,
    drawingHistory: room.drawingHistory,
    totalCommands: room.drawingHistory.length,
  });
});

app.get("/api/server/stats", (req, res) => {
  res.json(roomManager.getRoomStats());
});

process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  job.start();
});