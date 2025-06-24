import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import socket from "../socket";

const Chat = ({ setIsChatOpen, roomId}) => {
  const [message, setMessage] = useState("");
  const [messagesData, setMessagesData] = useState([]);

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", {
        roomId,
        text: message,
       
      });
      setMessage("");
    }
  };

  useEffect(() => {
    const incomingMessage = (msg) => {
      setMessagesData((prevMessages) => [...prevMessages, msg]);
    }

    socket.on("chatMessage", incomingMessage);
    return () => {
      socket.off("chatMessage", incomingMessage);
    };
  }, []);

  return (
    <div className="bg-cyan-100 rounded-xl shadow-lg p-4 absolute top-0 right-0 m-4 w-80 h-96 z-50">
      <div className="bg-cyan-100 rounded-lg p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Chat</h2>
          <button
            onClick={() => setIsChatOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto mb-4 space-y-2 text-sm pr-1">
          {messagesData.map((msg, idx) => (
            <div key={idx} className="bg-white p-2 rounded shadow">
              <div className="font-semibold text-indigo-700">{msg.userName}</div>
              <div>{msg.text}</div>
              <div className="text-gray-400 text-xs text-right">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow border border-gray-300 rounded-lg p-2 mr-2"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white rounded-lg px-4 py-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
