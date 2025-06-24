import React, { useState, useEffect, useRef } from "react";
import {
  Eraser,
  Download,
  X,
  MessageCircle,
  Users,
  Pencil,
  Circle,
  Square,
  ArrowRight,
} from "lucide-react";
import Chat from "./Chat";

const ToolBar = ({
  color,
  setColor,
  penSize,
  setPenSize,
  roomId,
  setIsEraser,
  tool,
  setTool,
  onClearCanvas,
  onExportCanvas,
  connectedUsers,
  isIndividualMode,
}) => {
  const tools = [
    { id: "pen", icon: Pencil, label: "Pen" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "square", icon: Square, label: "Rectangle" },
    { id: "arrow", icon: ArrowRight, label: "Arrow" },
  ];

  const presetColors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
  ];
  const colorInputRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleClick = () => {
    colorInputRef.current.click();
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  return (
    <div className="bg-blue-100 rounded-xl shadow-lg p-4 relative  ">
      <div className="flex items-center gap-2 lg:gap-4  flex-wrap">
        <div className="flex items-center gap-2 ">
          <div className="grid grid-cols-5 xl:grid-cols-10 gap-1 p-3 bg-gray-50 rounded-full ">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => setColor(presetColor)}
                className={`w-4 h-4 sm:w-6 sm:h-6 lg:w-6 lg:h-6  rounded-lg border-2 transition-all duration-200 ${
                  color === presetColor
                    ? "border-gray-800 scale-110"
                    : "border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: presetColor }}
              />
            ))}
          </div>

          <div
            onClick={handleClick}
            className="w-12 h-12 rounded-full cursor-pointer border-2 border-gray-300"
            style={{
              background:
                "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
            }}
            title="Click to pick color"
          ></div>

          <input
            ref={colorInputRef}
            type="color"
            value={color}
            onChange={handleColorChange}
            className="hidden"
          />
        </div>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setTool(id);
                setIsEraser(id === "eraser");
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                tool === id
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center sm:flex-row  gap-3 p-2 bg-gray-50 rounded-xl flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Size:</span>
            <input
              min="1"
              max="50"
              value={penSize}
              onChange={(e) => setPenSize(e.target.value)}
              type="range"
              className="w-20 accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 w-8">
              {penSize}px
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCanvas}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer duration-200"
            >
              <Download size={16} />
              Download
            </button>

            <button
              onClick={onClearCanvas}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer duration-200"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>

        {!isIndividualMode && (
          <div className="flex items-center gap-2 xl:ml-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
              <Users size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {connectedUsers} online
              </span>
            </div>
            <div
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
            >
              <MessageCircle size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Chat</span>
            </div>
          </div>
        )}
      </div>
      {isChatOpen && <Chat setIsChatOpen={setIsChatOpen} roomId={roomId} />}
    </div>
  );
};
export default ToolBar;
