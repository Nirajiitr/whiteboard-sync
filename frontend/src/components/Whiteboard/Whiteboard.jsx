import React, { useRef, useState } from "react";
import ToolBar from "../ToolBar";
import JoinRoom from "../JoinRoom";
import Canvas from "./Canvas";
import useWhiteboard from "./useWhiteboard";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const {
    color,
    penSize,
    isEraser,
    tool,
    setColor,
    setPenSize,
    setIsEraser,
    setTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearCanvas,
    exportCanvas,
    joined,
    roomId,
    isIndividualMode,
    setRoomData,
    connectedUsers,
  } = useWhiteboard(canvasRef, overlayCanvasRef);
  return (
    <div className=" relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 pb-4">
      {!(joined ) ? (
        <JoinRoom  onJoin={setRoomData} />
      ) : (
        <>
          <ToolBar
            color={color}
            setColor={setColor}
            penSize={penSize}
            setPenSize={setPenSize}
            isEraser={isEraser}
            setIsEraser={setIsEraser}
            tool={tool}
            setTool={setTool}
            onClearCanvas={clearCanvas}
            onExportCanvas={exportCanvas}
            connectedUsers={connectedUsers}
            roomId={roomId}
            isIndividualMode={isIndividualMode}
          />
          <Canvas
            canvasRef={canvasRef}
            overlayCanvasRef={overlayCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </>
      )}
    </div>
  );
};

export default Whiteboard;
