import { useEffect, useState, useCallback } from "react";
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
  const [roomData, setRoomData] = useState( null);
  const [joined, setJoined] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [startPoint, setStartPoint] = useState(null);

  useEffect(() => {
    const roomData = localStorage.getItem("roomData")
      ? JSON.parse(localStorage.getItem("roomData")):null;
    setRoomData(roomData)
    console.log(roomData)
  },[ ])
  const param = new URLSearchParams(window.location.search);
  const initialRoomId = param.get("Id") || null;
  const isIndividualMode = initialRoomId?.startsWith("solo-");

  useEffect(() => {
    if (isIndividualMode) setJoined(true);
  }, []);

  useEffect(() => {
    if (!(joined || isIndividualMode)) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");

    ctx.lineCap = overlayCtx.lineCap = "round";
    ctx.lineJoin = overlayCtx.lineJoin = "round";
  }, [joined, isIndividualMode]);

  useEffect(() => {
    if (!(joined || isIndividualMode)) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = overlayCanvas.width = rect.width;
      canvas.height = overlayCanvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [joined, isIndividualMode]);

  useEffect(() => {
    if (isIndividualMode || !roomData) return;

    const { type, ...payload } = roomData;

    if (type === "create") {
      socket.emit("createRoom", payload, (res) => {
        if (res.success) {
          setJoined(res.success);
          localStorage.setItem("roomData", JSON.stringify(res.roomData));
          toast.success("Room created successfully");
        } else {
          toast.error(res.message || "Failed to create room");
        }
      });
    } else if (type === "join") {
      socket.emit("joinRoom", payload, (res) => {
        if (res.success) {
          setJoined(res.success);
          localStorage.setItem("roomData",  JSON.stringify(res.roomData));
          toast.success("Joined room successfully");
        } else {
          toast.error(res.message || "Failed to join room");
        }
      });
    }

    socket.on("userCount", (data) => setConnectedUsers(data.count));

    return () => {
      socket.emit("leaveRoom", payload.roomId);
      socket.off("userCount");

      setJoined(false);
    };
  }, [roomData, isIndividualMode]);

  useEffect(() => {
    if (isIndividualMode) return;

    socket.on("connect", () => console.log("✅ Connected to server"));

    socket.on("drawing", ({ from, to, color, penSize, isEraser }) => {
      if (!from || !to) return;
      const ctx = canvasRef.current?.getContext("2d");
      drawLine(ctx, from, to, color, penSize, isEraser);
    });

    socket.on("shape", ({ start, end, color, penSize, tool }) => {
      if (!start || !end) return;
      const ctx = canvasRef.current?.getContext("2d");
      drawShape(ctx, start, end, tool, color, penSize);
    });

    socket.on("clear", () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx)
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    return () => {
      socket.off("drawing");
      socket.off("shape");
      socket.off("clear");
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
      ctx.globalCompositeOperation = isEraser
        ? "destination-out"
        : "source-over";
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
        drawLine(ctx, prevPoint, point, color, penSize, isEraser);
        if (!isIndividualMode) {
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

      overlayCanvasRef.current
        ?.getContext("2d")
        ?.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height
        );

      if (!isIndividualMode) {
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

    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    overlayCtx?.clearRect(
      0,
      0,
      overlayCanvasRef.current.width,
      overlayCanvasRef.current.height
    );

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
    link.download = `whiteboard-${roomData?.roomId || "untitled"}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [canvasRef, roomData?.roomId]);

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
    isIndividualMode,
    clearCanvas,
    exportCanvas,
    roomId: roomData?.roomId,
    joined,
    setRoomData,
    connectedUsers,
  };
};

export default useWhiteboard;
