import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  roomId: String,
  userName: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
