import { Router } from "express";
import { Charity } from "../models/Charity.js";
import { Draw } from "../models/Draw.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/charities", async (_req, res) => {
  const charities = await Charity.find({ active: true }).sort({ createdAt: 1 });
  res.json(charities);
});

router.get("/home", async (_req, res) => {
  const [charities, latestDraw, activeSubscribers, totals] = await Promise.all([
    Charity.find({ active: true }).sort({ totalRaised: -1 }).limit(3),
    Draw.findOne({ published: true }).sort({ publishedAt: -1 }).populate("winners.user", "name"),
    User.countDocuments({ role: "subscriber", subscriptionStatus: "active" }),
    Charity.aggregate([{ $group: { _id: null, raised: { $sum: "$totalRaised" } } }])
  ]);

  res.json({
    stats: {
      activeSubscribers,
      totalRaised: totals[0]?.raised || 0,
      latestPrizePool: latestDraw?.prizePool || 0
    },
    featuredCharities: charities,
    latestDraw
  });
});

export default router;

