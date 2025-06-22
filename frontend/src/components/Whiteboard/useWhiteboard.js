import { useEffect, useState } from "react";
import socket from "../../socket";
import { drawLine, drawShape } from "./drawingUtils";

const useWhiteboard = (canvasRef, overlayCanvasRef) => {
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [tool, setTool] = useState("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevPoint, setPrevPoint] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [startPoint, setStartPoint] = useState(null);

  useEffect(() => {
    if (!joined) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");

    ctx.lineCap = overlayCtx.lineCap = "round";
    ctx.lineJoin = overlayCtx.lineJoin = "round";
  }, [joined]);

  useEffect(() => {
    if (!joined) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      overlayCanvas.width = rect.width;
      overlayCanvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [joined]);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("joinRoom", roomId);
    setJoined(true);

    socket.on("userCount", (data) => setConnectedUsers(data.count));

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("userCount");
      setJoined(false);
      setRoomId("");
    };
  }, [roomId]);

  useEffect(() => {
    socket.on("connect", () => console.log("Connected to server"));

    socket.on("drawing", ({ from, to, color, penSize, isEraser }) => {
      if (!from || !to) return;
      const ctx = canvasRef.current.getContext("2d");
      drawLine(ctx, from, to, color, penSize, isEraser);
    });

    socket.on("shape", ({ start, end, color, penSize, tool }) => {
      if (!start || !end) return;
      const ctx = canvasRef.current.getContext("2d");
      drawShape(ctx, start, end, tool, color, penSize);
    });

    socket.on("clear", () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    return () => {
      socket.off("drawing");
      socket.off("shape");
      socket.off("clear");
    };
  }, []);

  const handleMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDrawing(true);
    setStartPoint(point);

    if (tool === "pen" || tool === "eraser") {
      const ctx = canvasRef.current.getContext("2d");
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
      if (prevPoint) {
        const ctx = canvasRef.current.getContext("2d");
        drawLine(ctx, prevPoint, point, color, penSize, isEraser);
        socket.emit("drawing", {
          roomId,
          from: prevPoint,
          to: point,
          color,
          penSize,
          isEraser,
        });
        setPrevPoint(point);
      }
    } else {
      const overlayCtx = overlayCanvasRef.current.getContext("2d");
      overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      if (startPoint) drawShape(overlayCtx, startPoint, point, tool, color, penSize);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPrevPoint(null);

    if ((tool !== "pen" && tool !== "eraser") && startPoint) {
      const rect = e.target.getBoundingClientRect();
      const endPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      const ctx = canvasRef.current.getContext("2d");
      drawShape(ctx, startPoint, endPoint, tool, color, penSize);

      overlayCanvasRef.current
        .getContext("2d")
        .clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

      socket.emit("shape", {
        roomId,
        start: startPoint,
        end: endPoint,
        color,
        penSize,
        tool,
      });
    }

    setStartPoint(null);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    const overlayCtx = overlayCanvasRef.current.getContext("2d");

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    if (roomId) socket.emit("clear", roomId);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const ctx = tempCanvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `whiteboard-${roomId || "untitled"}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  const handleJoinRoom = (id) => {
    if (!id) return;
    setRoomId(id);
  };

  return {
    color,
    setColor,
    penSize,
    setPenSize,
    isEraser,
    setIsEraser,
    tool,
    setTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleJoinRoom,
    clearCanvas,
    exportCanvas,
    roomId,
    joined,
    connectedUsers,
  };
};

export default useWhiteboard;
