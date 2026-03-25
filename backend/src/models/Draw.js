import mongoose from "mongoose";

const drawSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true },
    drawType: {
      type: String,
      enum: ["random", "algorithmic"],
      default: "random"
    },
    numbers: [{ type: Number, required: true }],
    published: { type: Boolean, default: false },
    jackpotRollover: { type: Number, default: 0 },
    prizePool: { type: Number, default: 0 },
    winners: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        matchCount: Number,
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "proof-submitted", "verified", "paid"],
          default: "pending"
        },
        proofUrl: { type: String, default: "" }
      }
    ],
    simulatedAt: Date,
    publishedAt: Date
  },
  { timestamps: true }
);

export const Draw = mongoose.model("Draw", drawSchema);

