import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  MessageCircle,
  Users,
  Pencil,
  ArrowRight,
  User,
  Sparkles,
  Zap,
  Share2,
  Palette,
  MousePointer,
  Globe,
  Lock,
  Play,
  Github,
  Star,
  Lightbulb,
} from "lucide-react";

const Homepage = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: <Pencil className="w-6 h-6" />,
      title: "Drawing Tools",
      description: "Pen, shapes, text, eraser, and color picker",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-Time Sync",
      description: "See changes instantly with WebSocket technology",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-User Collaboration",
      description: "Join sessions via shared links",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Access Control",
      description: "Create public or private rooms with permissions",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Save & Export",
      description: "Export as image or PDF format",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Real-time Chat",
      description: "Communicate while you collaborate",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">WhiteBoard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-white/80 hover:text-white transition-colors">
              <Github className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">MARS 2025</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm">
              Built for Real-time Collaboration
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Draw, Create,
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Collaborate
            </span>
          </h1>

          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the future of collaborative drawing. Create infinite
            canvases, work together in real-time, and bring your ideas to life
            with our powerful whiteboard platform.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <div className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500  transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  Individual Canvas
                </h3>
                <p className="text-white/70 mb-6 text-left">
                  Start drawing immediately on your personal canvas. Perfect for
                  brainstorming, sketching ideas, or creating diagrams solo.
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      navigate(
                        `/whiteboard?Id=solo-${Math.random()
                          .toString(36)
                          .substring(2, 15)}`
                      )
                    }
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer flex items-center space-x-2 group-hover:shadow-lg group-hover:shadow-purple-500/25"
                  >
                    <span>Start Drawing</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center text-white/60 text-sm">
                    <MousePointer className="w-4 h-4 mr-1" />
                    <span>Solo Mode</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  Collaborative Room
                </h3>
                <p className="text-white/70 mb-6 text-left">
                  Create or join a room to collaborate with your team in
                  real-time. Share ideas, draw together, and see changes
                  instantly.
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/whiteboard`)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer flex items-center space-x-2 group-hover:shadow-lg group-hover:shadow-pink-500/25"
                  >
                    <span>Create Room</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center text-white/60 text-sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    <span>Team Mode</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Everything you need for seamless collaboration and creative
            expression
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:border-white/20"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-purple-400 group-hover:text-pink-400 transition-colors duration-300">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">WhiteBoard</span>
            </div>

            <div className="flex items-center space-x-6 text-white/60 text-sm">
              <span>Built for MARS Open Projects 2025</span>
              <div className="flex items-center space-x-1">
                <Lightbulb className="w-4 h-4" />
                <span>Real-time Collaboration</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
     
    </div>
  );
};

export default Homepage;
