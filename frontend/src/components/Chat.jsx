import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import socket from "../socket";

const Chat = ({ setIsChatOpen, roomId }) => {
    const [message, setMessage] =useState("");
    const [messagesData, setMessagesData] = useState([]);
   const handleSendMessage = () => {
    socket.emit("chatMessage",{ roomId, text: message });
    setMessage("");
    }
   
    useEffect(() => {
        socket.on("chatMessage", (msg) => {
            console.log("Received message:", msg);
            setMessagesData((prevMessages) => [
                ...prevMessages,
                { userId: msg.userId, text: msg.text, timestamp: msg.timestamp },
            ]);
        });
        return () => {
            socket.off("chatMessage");
        }
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
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto mb-4">
            {/* Messages will be displayed here */}
            {messagesData.map((msg, index) => (
                <div key={index} className="mb-2">
                <span className="font-semibold">{msg.userId}: </span>
                <span>{msg.text}</span>
                <span className="text-gray-500 text-xs ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
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
    </div>
  );
};

export default Chat;
