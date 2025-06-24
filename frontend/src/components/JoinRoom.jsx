import React, { useState } from "react";
import {
  LogIn,
  Plus,
  X,
  Lock,
  Crown,
  Pencil,
  MessageCircle,
  Download,
  Settings,
  Shield,
} from "lucide-react";

const JoinRoom = ({ onJoin}) => {
  const [activeTab, setActiveTab] = useState("join");
  const [roomInput, setRoomInput] = useState("");
  const [userName, setUserName] = useState("");
  const [roomData, setRoomData] = useState({
    name: "",
    access: "private",
    adminName: "",
    maxUsers: 10,
    permissions: {
      allowEdit: true,
      allowChat: true,
      allowExport: true,
    },
  });

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (roomInput.trim() && userName.trim()) {
      onJoin({
        type: "join",
        roomId: roomInput,
        userName,
      });
    }
    setRoomInput("");
    setUserName("");
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (roomData.name.trim() && roomData.adminName.trim()) {
      const roomId =
        roomData.name.toLowerCase().replace(/[^a-z0-9]/g, "-") +
        "-" +
        Date.now().toString(36);
      onJoin({
        type: "create",
        roomId,
        ...roomData,
        createdAt: new Date().toISOString(),
      });
    }
    setRoomData({
      name: "",
      access: "private",
      adminName: "",
      maxUsers: 10,
      permissions: {
        allowEdit: true,
        allowChat: true,
        allowExport: true,
      },
    });
  };

  const generateRoomId = () => {
    const roomId = "room-" + Math.random().toString(36).substr(2, 9);
    setRoomData((prev) => ({ ...prev, name: roomId }));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-center items-center">
            <h2 className="text-2xl font-bold">Collaborative Whiteboard</h2>
           
          </div>

          <div className="flex mt-4 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === "join"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Join Room</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === "create"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
          {activeTab === "join" ? (
            <form onSubmit={handleJoinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Room ID *
                </label>
                <input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  type="text"
                  placeholder="Enter room ID (e.g., room-abc123)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Your Name *
                </label>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  type="text"
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!roomInput.trim() || !userName.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Join Room</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Room Id *
                  </label>
                  <input
                    value={roomData.name}
                    onChange={(e) =>
                      setRoomData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    type="text"
                    placeholder="My Awesome Room"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                </div>

                <div className="text-center md:text-center text-gray-600 font-medium mb-2">
                  <span className="block md:inline">or</span>
                </div>

                <div className="flex md:justify-start justify-center">
                  <button
                    type="button"
                    onClick={generateRoomId}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm"
                  >
                    Generate ID
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Admin Name *
                </label>
                <input
                  value={roomData.adminName}
                  onChange={(e) =>
                    setRoomData((prev) => ({
                      ...prev,
                      adminName: e.target.value,
                    }))
                  }
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                  required
                />
              </div>

              <div className="bg-gray-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Access Control
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Access
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="access"
                          value="private"
                          checked={roomData.access === "private"}
                          onChange={(e) =>
                            setRoomData((prev) => ({
                              ...prev,
                              access: e.target.value,
                            }))
                          }
                          className="mr-2"
                        />
                        <Lock className="w-4 h-4 mr-1" />
                        <span className="text-sm">Private</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Users
                    </label>
                    <select
                      value={roomData.maxUsers}
                      onChange={(e) =>
                        setRoomData((prev) => ({
                          ...prev,
                          maxUsers: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                    >
                      <option value={5}>5 Users</option>
                      <option value={10}>10 Users</option>
                      <option value={20}>20 Users</option>
                      <option value={50}>50 Users</option>
                      <option value={100}>100 Users</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Room Permissions
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={roomData.permissions.allowEdit}
                      onChange={(e) =>
                        setRoomData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            allowEdit: e.target.checked,
                          },
                        }))
                      }
                      className="mr-3"
                    />
                    <Pencil className="w-4 h-4 mr-2" />
                    <span className="text-sm">Allow all users to edit</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={roomData.permissions.allowChat}
                      onChange={(e) =>
                        setRoomData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            allowChat: e.target.checked,
                          },
                        }))
                      }
                      className="mr-3"
                    />
                    <MessageCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Enable chat</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={roomData.permissions.allowExport}
                      onChange={(e) =>
                        setRoomData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            allowExport: e.target.checked,
                          },
                        }))
                      }
                      className="mr-3"
                    />
                    <Download className="w-4 h-4 mr-2" />
                    <span className="text-sm">Allow export/save</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!roomData.name.trim() || !roomData.adminName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Crown className="w-5 h-5" />
                  <span>Create Room</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
          {activeTab === "join" ? (
            <p>
              Don't have a room? Switch to <strong>Create Room</strong> tab
            </p>
          ) : (
            <p>
              Room ID will be generated automatically when you create the room
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
