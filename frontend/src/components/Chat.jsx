import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import socket from "../socket";
import axios from "axios";
const Chat = ({ setIsChatOpen, roomId, isChatOpen }) => {
  const [message, setMessage] = useState("");
  const [messagesData, setMessagesData] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${roomId}`);
        setMessagesData(res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    fetchMessages();
  }, [roomId,isChatOpen ]);

  useEffect(() => {
    const incomingMessage = (msg) => {
      setMessagesData((prev) => [...prev, msg]);
    };

    socket.on("chatMessage", incomingMessage);
    return () => {
      socket.off("chatMessage", incomingMessage);
    };
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      const userName = localStorage.getItem("userName") || "Anonymous";

      socket.emit("chatMessage", {
        roomId,
        text: message,
        userName,
        timestamp: new Date(),
      });

      setMessage("");
    }
  };

  return (
    <div className="bg-cyan-100 rounded-xl shadow-lg p-4 fixed top-0 right-0 m-4 w-80 h-96 z-50">
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
          {messagesData.map((msg, idx) => {
            const isOwn = msg.userId === socket.id;
            return (
              <div
                key={idx}
                className={`p-2 rounded shadow max-w-[90%] ${
                  isOwn ? "bg-blue-100 ml-auto text-right" : "bg-white"
                }`}
              >
                <div className="font-semibold text-indigo-700 break-words">
                  {msg.userName}
                </div>
                <div className="break-words">{msg.text}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
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
