import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Charity } from "../models/Charity.js";
import { Draw } from "../models/Draw.js";
import { User } from "../models/User.js";
import { publishDraw, saveSimulation } from "../services/drawService.js";
import { retainLatestFiveScores } from "../utils/score.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", async (_req, res) => {
  const [users, charities, draws, totals] = await Promise.all([
    User.find().populate("charity").sort({ createdAt: -1 }),
    Charity.find().sort({ createdAt: -1 }),
    Draw.find().sort({ createdAt: -1 }).populate("winners.user", "name email"),
    Charity.aggregate([{ $group: { _id: null, totalRaised: { $sum: "$totalRaised" } } }])
  ]);

  const prizePoolTotal = draws.reduce((sum, draw) => sum + draw.prizePool, 0);

  res.json({
    metrics: {
      totalUsers: users.length,
      activeSubscribers: users.filter((user) => user.subscriptionStatus === "active" && user.role === "subscriber").length,
      totalPrizePool: prizePoolTotal,
      totalRaised: totals[0]?.totalRaised || 0
    },
    users: users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      charityPercentage: user.charityPercentage,
      currentCycleCharityContribution: user.currentCycleCharityContribution,
      independentDonationTotal: user.independentDonationTotal,
      charity: user.charity,
      scores: retainLatestFiveScores(user.scores),
      winningsTotal: user.winningsTotal
    })),
    charities,
    draws
  });
});

router.post("/charities", async (req, res) => {
  const charity = await Charity.create(req.body);
  res.status(201).json(charity);
});

router.put("/charities/:id", async (req, res) => {
  const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(charity);
});

router.delete("/charities/:id", async (req, res) => {
  await Charity.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

router.post("/draws/simulate", async (req, res) => {
  const draw = await saveSimulation(req.body.drawType || "random");
  res.status(201).json(draw);
});

router.post("/draws/:monthKey/publish", async (req, res) => {
  try {
    const draw = await publishDraw(req.params.monthKey);
    res.json(draw);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.patch("/draws/:drawId/winners/:winnerId", async (req, res) => {
  const { status } = req.body;
  const draw = await Draw.findOneAndUpdate(
    { _id: req.params.drawId, "winners._id": req.params.winnerId },
    { $set: { "winners.$.status": status } },
    { new: true }
  ).populate("winners.user", "name email");

  res.json(draw);
});

router.patch("/users/:id", async (req, res) => {
  const updates = { ...req.body };
  delete updates.passwordHash;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).populate("charity");
  res.json(user);
});

router.patch("/users/:id/scores", async (req, res) => {
  const { scores } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.scores = retainLatestFiveScores(scores || []);
  await user.save();

  res.json(user);
});

export default router;
