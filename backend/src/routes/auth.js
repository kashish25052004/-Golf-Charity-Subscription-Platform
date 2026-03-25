import { Router } from "express";
import bcrypt from "bcryptjs";
import { Charity } from "../models/Charity.js";
import { User } from "../models/User.js";
import { calculateCharityContribution, calculateSubscriptionAmount } from "../utils/charity.js";
import { signToken } from "../utils/tokens.js";

const router = Router();

function userPayload(user) {
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
    scores: user.scores,
    winningsTotal: user.winningsTotal,
    createdAt: user.createdAt
  };
}

router.post("/register", async (req, res) => {
  const { name, email, password, plan = "monthly", charityId, charityPercentage = 10 } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Account already exists." });
  }

  let charity = null;
  if (charityId) {
    charity = await Charity.findById(charityId);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const safeCharityPercentage = Math.max(10, Number(charityPercentage) || 10);
  const subscriptionAmount = calculateSubscriptionAmount(plan);
  const currentCycleCharityContribution = calculateCharityContribution(
    subscriptionAmount,
    safeCharityPercentage
  );
  const monthsToAdd = plan === "yearly" ? 12 : 1;
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + monthsToAdd);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    plan,
    charity: charity?._id,
    charityPercentage: safeCharityPercentage,
    subscriptionAmount,
    currentCycleCharityContribution,
    subscriptionStatus: "active",
    subscriptionRenewsAt: renewsAt
  });

  if (charity) {
    charity.totalRaised += currentCycleCharityContribution;
    await charity.save();
  }

  const populated = await User.findById(user._id).populate("charity");
  return res.status(201).json({
    token: signToken(populated),
    user: userPayload(populated)
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).populate("charity");

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  return res.json({
    token: signToken(user),
    user: userPayload(user)
  });
});

export default router;
