import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    value: { type: Number, min: 1, max: 45, required: true },
    playedAt: { type: Date, required: true }
  },
  { _id: true, timestamps: true }
);

const winnerProofSchema = new mongoose.Schema(
  {
    draw: { type: mongoose.Schema.Types.ObjectId, ref: "Draw" },
    proofUrl: { type: String, default: "" },
    submittedAt: Date
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["subscriber", "admin"], default: "subscriber" },
    plan: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    subscriptionStatus: {
      type: String,
      enum: ["active", "cancelled", "lapsed", "trial"],
      default: "active"
    },
    subscriptionAmount: { type: Number, default: 29 },
    subscriptionRenewsAt: Date,
    charity: { type: mongoose.Schema.Types.ObjectId, ref: "Charity" },
    charityPercentage: { type: Number, min: 10, max: 100, default: 10 },
    currentCycleCharityContribution: { type: Number, default: 0 },
    independentDonationTotal: { type: Number, default: 0 },
    scores: [scoreSchema],
    winningsTotal: { type: Number, default: 0 },
    winnerProofs: [winnerProofSchema]
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
