import React, { useState } from 'react'

const JoinRoom = ({ onJoin }) => {
  const [roomInput, setRoomInput] = useState('');

  const handleSubmit = (e) => {
    if (roomInput.trim()) {
      onJoin(roomInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join Whiteboard Room</h2>
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              type="text"
              placeholder="Enter room ID or create new..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              autoFocus
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium"
          >
            Join Room
          </button>
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">
          Enter an existing room ID to join, or create a new room with any name
        </p>
      </div>
    </div>
  );
};


export default JoinRoom
