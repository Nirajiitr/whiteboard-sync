import { useEffect, useState, useCallback, useRef } from "react";
import socket from "../../socket";
import { drawLine, drawShape } from "./drawingUtils";
import toast from "react-hot-toast";

const useWhiteboard = (canvasRef, overlayCanvasRef) => {
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [tool, setTool] = useState("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevPoint, setPrevPoint] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [joined, setJoined] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [startPoint, setStartPoint] = useState(null);
  const [userList, setUserList] = useState([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState([]);
  
  // Use ref to prevent stale closures in socket event handlers
  const roomDataRef = useRef(roomData);
  const joinedRef = useRef(joined);
  const canvasReadyRef = useRef(false);
  
  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);
  
  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  // Get URL parameters
  const param = new URLSearchParams(window.location.search);
  const initialRoomId = param.get("Id") || null;
  const isIndividualMode = initialRoomId?.startsWith("solo-");

  // Initialize room data from localStorage on mount
  useEffect(() => {
    const storedRoomData = localStorage.getItem("roomData");
    if (storedRoomData && !isIndividualMode) {
      try {
        const parsedData = JSON.parse(storedRoomData);
        console.log("Found stored room data:", parsedData);
        
        // Set up for rejoining
        if (parsedData.roomId && parsedData.adminName) {
          setRoomData({ 
            type: "rejoin", 
            roomId: parsedData.roomId, 
            userName: parsedData.adminName 
          });
        }
      } catch (error) {
        console.error("Failed to parse stored room data:", error);
        localStorage.removeItem("roomData");
      }
    } else if (isIndividualMode) {
      setJoined(true);
    }
  }, [isIndividualMode]);

  // Initialize canvas settings when joined
  useEffect(() => {
    if (!(joined || isIndividualMode)) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");

    ctx.lineCap = overlayCtx.lineCap = "round";
    ctx.lineJoin = overlayCtx.lineJoin = "round";
    
    canvasReadyRef.current = true;
    
    // Replay drawing history if we have any
    if (drawingHistory.length > 0) {
      replayDrawingHistory(drawingHistory);
    }
  }, [joined, isIndividualMode]);

  // Handle canvas resize
  useEffect(() => {
    if (!(joined || isIndividualMode)) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      
      // Store current drawing before resize
      const imageData = canvas.getContext("2d").getImageData(0, 0, oldWidth, oldHeight);
      
      canvas.width = overlayCanvas.width = rect.width;
      canvas.height = overlayCanvas.height = rect.height;
      
      // Restore drawing after resize if we had content
      if (oldWidth > 0 && oldHeight > 0) {
        const ctx = canvas.getContext("2d");
        ctx.putImageData(imageData, 0, 0);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [joined, isIndividualMode]);

  // Replay drawing history function
  const replayDrawingHistory = useCallback((history) => {
    if (!history || history.length === 0 || !canvasReadyRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    console.log(`Replaying ${history.length} drawing commands`);
    
    // Set up canvas context
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Replay each drawing command
    history.forEach((command, index) => {
      try {
        if (command.type === "drawing" && command.from && command.to) {
          // Use the same drawing function as real-time drawing
          ctx.save();
          ctx.globalCompositeOperation = command.isEraser ? "destination-out" : "source-over";
          ctx.strokeStyle = command.color || "#000000";
          ctx.lineWidth = command.isEraser ? (command.penSize || 3) * 2 : (command.penSize || 3);
          
          ctx.beginPath();
          ctx.moveTo(command.from.x, command.from.y);
          ctx.lineTo(command.to.x, command.to.y);
          ctx.stroke();
          ctx.restore();
          
        } else if (command.type === "shape" && command.start && command.end) {
          drawShape(ctx, command.start, command.end, command.tool, command.color, command.penSize);
        }
      } catch (error) {
        console.error(`Error replaying command ${index}:`, error, command);
      }
    });
    
    console.log("Drawing history replay completed");
  }, [canvasRef]);

  // Handle room operations (create/join/rejoin)
  useEffect(() => {
    if (isIndividualMode || !roomData || joined) return;

    const { type, ...payload } = roomData;
    console.log("Processing room operation:", type, payload);

    const handleRoomResponse = (res, successMessage) => {
      console.log("Room response:", res);
      if (res.success) {
        setJoined(true);
        const updatedRoomData = { ...res.roomData };
        setRoomData(updatedRoomData);
        localStorage.setItem("roomData", JSON.stringify(updatedRoomData));
        
        // Store and replay drawing history
        if (res.drawingHistory && res.drawingHistory.length > 0) {
          console.log(`Received ${res.drawingHistory.length} drawing commands`);
          setDrawingHistory(res.drawingHistory);
          
          // Replay immediately if canvas is ready
          if (canvasReadyRef.current) {
            setTimeout(() => replayDrawingHistory(res.drawingHistory), 100);
          }
        }
        
        toast.success(successMessage);
      } else {
        console.error("Room operation failed:", res.message);
        toast.error(res.message || `Failed to ${type} room`);
        
        if (type === "rejoin") {
          // Clear invalid room data on rejoin failure
          localStorage.removeItem("roomData");
          setRoomData(null);
        }
      }
    };

    if (type === "create") {
      socket.emit("createRoom", payload, (res) => {
        handleRoomResponse(res, "Room created successfully");
      });
    } else if (type === "join") {
      socket.emit("joinRoom", payload, (res) => {
        handleRoomResponse(res, "Joined room successfully");
      });
    } else if (type === "rejoin") {
      console.log("Attempting to rejoin room:", payload.roomId);
      socket.emit("rejoinRoom", payload, (res) => {
        handleRoomResponse(res, "Reconnected to room");
      });
    }
  }, [roomData, isIndividualMode, joined, replayDrawingHistory]);

  // Socket event handlers
  useEffect(() => {
    if (isIndividualMode) return;

    const handleConnect = () => {
      console.log("✅ Connected to server");
      setIsReconnecting(false);
    };

    const handleDisconnect = (reason) => {
      console.log("❌ Disconnected from server:", reason);
      setIsReconnecting(true);
      setJoined(false);
    };

    const handleReconnect = () => {
      console.log("🔄 Reconnected to server");
      setIsReconnecting(false);
      
      // Try to rejoin room after reconnection
      const storedRoomData = localStorage.getItem("roomData");
      if (storedRoomData) {
        try {
          const parsedData = JSON.parse(storedRoomData);
          if (parsedData.roomId && parsedData.adminName) {
            console.log("Auto-rejoining room after reconnection:", parsedData.roomId);
            setRoomData({ 
              type: "rejoin", 
              roomId: parsedData.roomId, 
              userName: parsedData.adminName 
            });
          }
        } catch (error) {
          console.error("Failed to rejoin room after reconnection:", error);
        }
      }
    };

    const handleDrawing = ({ from, to, color, penSize, isEraser }) => {
      if (!from || !to) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasReadyRef.current) {
        // Use the same method as replay for consistency
        ctx.save();
        ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
        ctx.strokeStyle = color || "#000000";
        ctx.lineWidth = isEraser ? (penSize || 3) * 2 : (penSize || 3);
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
      }
    };

    const handleShape = ({ start, end, color, penSize, tool }) => {
      if (!start || !end) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasReadyRef.current) {
        drawShape(ctx, start, end, tool, color, penSize);
      }
    };

    const handleClear = () => {
      const ctx = canvasRef.current?.getContext("2d");
      const overlayCtx = overlayCanvasRef.current?.getContext("2d");
      
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (overlayCtx) {
        overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
      
      setDrawingHistory([]);
    };

    const handleUserCount = (data) => {
      setConnectedUsers(data.count);
    };

    const handleUserList = (users) => {
      setUserList(users);
    };

    // Register event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", handleReconnect);
    socket.on("drawing", handleDrawing);
    socket.on("shape", handleShape);
    socket.on("clear", handleClear);
    socket.on("userCount", handleUserCount);
    socket.on("userList", handleUserList);

    return () => {
      // Cleanup event listeners
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleReconnect);
      socket.off("drawing", handleDrawing);
      socket.off("shape", handleShape);
      socket.off("clear", handleClear);
      socket.off("userCount", handleUserCount);
      socket.off("userList", handleUserList);
    };
  }, [isIndividualMode, canvasRef, overlayCanvasRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isIndividualMode && roomDataRef.current?.roomId) {
        socket.emit("leaveRoom", roomDataRef.current.roomId);
      }
    };
  }, [isIndividualMode]);

  const handleMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDrawing(true);
    setStartPoint(point);

    if (tool === "pen" || tool === "eraser") {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      
      ctx.save();
      ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = isEraser ? penSize * 2 : penSize;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      setPrevPoint(point);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (tool === "pen" || tool === "eraser") {
      const ctx = canvasRef.current?.getContext("2d");
      if (prevPoint && ctx) {
        // Draw locally first
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        
        // Then emit to other users
        if (!isIndividualMode && roomData?.roomId) {
          socket.emit("drawing", {
            roomId: roomData.roomId,
            from: prevPoint,
            to: point,
            color,
            penSize,
            isEraser,
          });
        }
        setPrevPoint(point);
      }
    } else {
      // Handle shape tools
      const overlayCtx = overlayCanvasRef.current?.getContext("2d");
      if (!overlayCtx || !startPoint) return;
      
      overlayCtx.clearRect(
        0,
        0,
        overlayCanvasRef.current.width,
        overlayCanvasRef.current.height
      );
      drawShape(overlayCtx, startPoint, point, tool, color, penSize);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPrevPoint(null);

    if (tool !== "pen" && tool !== "eraser" && startPoint) {
      const rect = e.target.getBoundingClientRect();
      const endPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      drawShape(ctx, startPoint, endPoint, tool, color, penSize);

      // Clear overlay canvas
      const overlayCtx = overlayCanvasRef.current?.getContext("2d");
      if (overlayCtx) {
        overlayCtx.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height
        );
      }

      if (!isIndividualMode && roomData?.roomId) {
        socket.emit("shape", {
          roomId: roomData.roomId,
          start: startPoint,
          end: endPoint,
          color,
          penSize,
          tool,
        });
      }
    }

    setStartPoint(null);
  };

  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const overlayCtx = overlayCanvasRef.current?.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (overlayCtx) {
      overlayCtx.clearRect(
        0,
        0,
        overlayCanvasRef.current.width,
        overlayCanvasRef.current.height
      );
    }

    setDrawingHistory([]);

    if (!isIndividualMode && roomData?.roomId) {
      socket.emit("clear", roomData.roomId);
    }
  }, [canvasRef, overlayCanvasRef, isIndividualMode, roomData?.roomId]);

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `whiteboard-${roomData?.roomId || "untitled"}-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [canvasRef, roomData?.roomId]);

  const leaveRoom = useCallback(() => {
    if (!isIndividualMode && roomData?.roomId) {
      socket.emit("leaveRoom", roomData.roomId);
      setJoined(false);
      setRoomData(null);
      setDrawingHistory([]);
      localStorage.removeItem("roomData");
      toast.success("Left room successfully");
    }
  }, [isIndividualMode, roomData?.roomId]);

  return {
    // Drawing state
    color,
    setColor,
    penSize,
    setPenSize,
    isEraser,
    setIsEraser,
    tool,
    setTool,
    
    // Mouse handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // Canvas actions
    clearCanvas,
    exportCanvas,
    
    // Room state
    roomId: roomData?.roomId,
    roomData,
    setRoomData,
    joined,
    connectedUsers,
    userList,
    isIndividualMode,
    isReconnecting,
    
    // Room actions
    leaveRoom,
  };
};

export default useWhiteboard;