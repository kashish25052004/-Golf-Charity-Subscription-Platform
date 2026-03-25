import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Charity } from "../models/Charity.js";
import { Draw } from "../models/Draw.js";
import { User } from "../models/User.js";
import { calculateCharityContribution, calculateSubscriptionAmount } from "../utils/charity.js";
import { retainLatestFiveScores } from "../utils/score.js";

const router = Router();

function mapUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionAmount: user.subscriptionAmount,
    subscriptionRenewsAt: user.subscriptionRenewsAt,
    charity: user.charity,
    charityPercentage: user.charityPercentage,
    currentCycleCharityContribution: user.currentCycleCharityContribution,
    independentDonationTotal: user.independentDonationTotal,
    scores: retainLatestFiveScores(user.scores),
    winningsTotal: user.winningsTotal,
    winnerProofs: user.winnerProofs
  };
}

async function buildParticipation(user) {
  const publishedDraws = await Draw.find({ published: true }).sort({ publishedAt: -1 });
  const winnerHistory = publishedDraws
    .map((draw) => {
      const winner = draw.winners.find((entry) => entry.user?.toString() === user._id.toString());
      if (!winner) {
        return null;
      }
      return {
        drawId: draw._id,
        monthKey: draw.monthKey,
        amount: winner.amount,
        matchCount: winner.matchCount,
        status: winner.status,
        proofUrl: winner.proofUrl
      };
    })
    .filter(Boolean);

  return {
    enteredDraws: publishedDraws.length,
    upcomingDrawMonth: new Date().toISOString().slice(0, 7),
    isEligible: user.subscriptionStatus === "active" && retainLatestFiveScores(user.scores).length > 0,
    winnerHistory
  };
}

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const latestDraw = await Draw.findOne({ published: true })
    .sort({ publishedAt: -1 })
    .populate("winners.user", "name email");
  const charities = await Charity.find({ active: true }).sort({ name: 1 });
  const participation = await buildParticipation(req.user);
  res.json({
    user: mapUser(req.user),
    charities,
    latestDraw,
    participation
  });
});

router.post("/scores", async (req, res) => {
  const { value, playedAt } = req.body;

  if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 45 || !playedAt) {
    return res.status(400).json({ message: "Score must be between 1 and 45 with a valid date." });
  }

  req.user.scores.push({
    value: Number(value),
    playedAt: new Date(playedAt)
  });
  req.user.scores = retainLatestFiveScores(req.user.scores);
  await req.user.save();

  res.status(201).json({ scores: retainLatestFiveScores(req.user.scores) });
});

router.delete("/scores/:scoreId", async (req, res) => {
  req.user.scores = req.user.scores.filter((score) => score._id.toString() !== req.params.scoreId);
  await req.user.save();
  res.json({ scores: retainLatestFiveScores(req.user.scores) });
});

router.patch("/charity", async (req, res) => {
  const charity = await Charity.findById(req.body.charityId);
  if (!charity) {
    return res.status(404).json({ message: "Charity not found." });
  }

  req.user.charity = charity._id;
  if (req.body.charityPercentage) {
    req.user.charityPercentage = Math.max(10, Number(req.body.charityPercentage));
  }
  req.user.currentCycleCharityContribution = calculateCharityContribution(
    req.user.subscriptionAmount,
    req.user.charityPercentage
  );
  await req.user.save();
  charity.totalRaised += req.user.currentCycleCharityContribution;
  await charity.save();
  const refreshed = await User.findById(req.user._id).populate("charity");
  res.json({ user: mapUser(refreshed) });
});

router.patch("/subscription", async (req, res) => {
  const { plan, subscriptionStatus, charityPercentage } = req.body;

  if (plan) {
    req.user.plan = plan;
    req.user.subscriptionAmount = calculateSubscriptionAmount(plan);
  }

  if (charityPercentage) {
    req.user.charityPercentage = Math.max(10, Number(charityPercentage));
  }

  if (subscriptionStatus) {
    req.user.subscriptionStatus = subscriptionStatus;
  }

  req.user.currentCycleCharityContribution = calculateCharityContribution(
    req.user.subscriptionAmount,
    req.user.charityPercentage
  );

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + (req.user.plan === "yearly" ? 12 : 1));
  req.user.subscriptionRenewsAt = renewsAt;
  await req.user.save();

  if (req.user.charity) {
    await Charity.findByIdAndUpdate(req.user.charity, {
      $inc: { totalRaised: req.user.currentCycleCharityContribution }
    });
  }

  res.json({ user: mapUser(req.user) });
});

router.post("/donations", async (req, res) => {
  const { amount } = req.body;

  if (!req.user.charity) {
    return res.status(400).json({ message: "Select a charity first." });
  }

  const safeAmount = Number(amount);
  if (!safeAmount || safeAmount <= 0) {
    return res.status(400).json({ message: "Donation amount must be greater than 0." });
  }

  req.user.independentDonationTotal += safeAmount;
  await req.user.save();
  await Charity.findByIdAndUpdate(req.user.charity, { $inc: { totalRaised: safeAmount } });

  const refreshed = await User.findById(req.user._id).populate("charity");
  res.status(201).json({ user: mapUser(refreshed) });
});

router.post("/winner-proof", async (req, res) => {
  const { drawId, proofUrl } = req.body;
  if (!drawId || !proofUrl) {
    return res.status(400).json({ message: "drawId and proofUrl are required." });
  }

  const existing = req.user.winnerProofs.find((item) => item.draw?.toString() === drawId);
  if (existing) {
    existing.proofUrl = proofUrl;
    existing.submittedAt = new Date();
  } else {
    req.user.winnerProofs.push({ draw: drawId, proofUrl, submittedAt: new Date() });
  }
  await req.user.save();

  await Draw.updateOne(
    { _id: drawId, "winners.user": req.user._id },
    {
      $set: {
        "winners.$.proofUrl": proofUrl,
        "winners.$.status": "proof-submitted"
      }
    }
  );

  res.json({ message: "Proof submitted." });
});

export default router;
