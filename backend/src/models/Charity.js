import mongoose from "mongoose";

const charitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    summary: { type: String, required: true, trim: true },
    longDescription: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    impactMetric: { type: String, default: "" },
    active: { type: Boolean, default: true },
    totalRaised: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Charity = mongoose.model("Charity", charitySchema);

