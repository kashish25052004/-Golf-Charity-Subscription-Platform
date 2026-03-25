import { Draw } from "../models/Draw.js";
import { User } from "../models/User.js";
import { scoreFrequencyMap } from "../utils/score.js";

function getMonthKey(input = new Date()) {
  return input.toISOString().slice(0, 7);
}

function uniqueFiveNumbers(source) {
  return [...new Set(source)].slice(0, 5);
}

function randomNumbers() {
  const values = [];
  while (values.length < 5) {
    const candidate = Math.floor(Math.random() * 45) + 1;
    if (!values.includes(candidate)) {
      values.push(candidate);
    }
  }
  return values.sort((a, b) => a - b);
}

function algorithmicNumbers(users) {
  const frequency = [...scoreFrequencyMap(users).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);

  const weighted = uniqueFiveNumbers(frequency);
  if (weighted.length === 5) {
    return weighted.sort((a, b) => a - b);
  }

  const fallback = [...weighted];
  while (fallback.length < 5) {
    const candidate = Math.floor(Math.random() * 45) + 1;
    if (!fallback.includes(candidate)) {
      fallback.push(candidate);
    }
  }
  return fallback.sort((a, b) => a - b);
}

function matchCount(userNumbers, winningNumbers) {
  return userNumbers.filter((value) => winningNumbers.includes(value)).length;
}

export async function simulateDraw(drawType = "random") {
  const users = await User.find({ subscriptionStatus: "active", role: "subscriber" });
  const monthKey = getMonthKey();
  const numbers = drawType === "algorithmic" ? algorithmicNumbers(users) : randomNumbers();
  const prizePoolBase = users.reduce((sum, user) => sum + Math.round(user.subscriptionAmount * 0.45), 0);
  const existing = await Draw.findOne({ monthKey });
  const jackpotRollover = existing?.jackpotRollover || 0;
  const prizePool = prizePoolBase + jackpotRollover;

  const winners = users
    .map((user) => {
      const matches = matchCount(user.scores.map((score) => score.value), numbers);
      return { user, matches };
    })
    .filter((entry) => entry.matches >= 3);

  const grouped = {
    5: winners.filter((entry) => entry.matches === 5),
    4: winners.filter((entry) => entry.matches === 4),
    3: winners.filter((entry) => entry.matches === 3)
  };

  const payoutRules = { 5: 0.4, 4: 0.35, 3: 0.25 };
  const winnerPayload = [];

  [5, 4, 3].forEach((count) => {
    const group = grouped[count];
    if (!group.length) {
      return;
    }

    const groupPool = prizePool * payoutRules[count];
    const eachAmount = Math.round(groupPool / group.length);
    group.forEach((entry) => {
      winnerPayload.push({
        user: entry.user._id,
        matchCount: count,
        amount: eachAmount,
        status: "pending"
      });
    });
  });

  const nextRollover = grouped[5].length ? 0 : Math.round(prizePool * 0.4);

  return {
    monthKey,
    drawType,
    numbers,
    prizePool,
    jackpotRollover: nextRollover,
    winners: winnerPayload
  };
}

export async function saveSimulation(drawType = "random") {
  const simulation = await simulateDraw(drawType);
  return Draw.findOneAndUpdate(
    { monthKey: simulation.monthKey },
    {
      ...simulation,
      published: false,
      simulatedAt: new Date()
    },
    { upsert: true, new: true }
  ).populate("winners.user", "name email");
}

export async function publishDraw(monthKey) {
  const draw = await Draw.findOne({ monthKey }).populate("winners.user");

  if (!draw) {
    throw new Error("Draw not found.");
  }

  draw.published = true;
  draw.publishedAt = new Date();
  await draw.save();

  for (const winner of draw.winners) {
    if (!winner.user) {
      continue;
    }
    await User.findByIdAndUpdate(winner.user._id, {
      $inc: { winningsTotal: winner.amount }
    });
  }

  return Draw.findById(draw._id).populate("winners.user", "name email");
}
