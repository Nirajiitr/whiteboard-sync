import React from "react";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-200 flex flex-col justify-center items-center px-4">
      <h1 className="text-5xl font-bold text-gray-800 text-center mb-6">
        Collaborative Whiteboard
      </h1>
      <p className="text-lg text-gray-700 text-center max-w-2xl mb-10">
        Draw, collaborate, and create in real-time with your team or friends. Join or create a room and start sketching together on an infinite canvas.
      </p>
      <div className="flex gap-4">
        <Link to="/whiteboard">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300">
            Launch Whiteboard
          </button>
        </Link>
        <a
          href="https://github.com/your-username/whiteboard-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-xl shadow-md transition-all duration-300">
            View on GitHub
          </button>
        </a>
      </div>
      <footer className="mt-20 text-sm text-gray-500">
        Built for MARS Open Projects 2025 — Real-time Collaboration
      </footer>
    </div>
  );
};

export default Homepage;
