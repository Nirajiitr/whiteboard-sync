import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  name: String,
  access: { type: String, enum: ["private"], default: "private" },
  adminName: String,
  maxUsers: Number,
  permissions: {
    allowEdit: Boolean,
    allowChat: Boolean,
    allowExport: Boolean,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Room", roomSchema);
