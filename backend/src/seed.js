import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { Charity } from "./models/Charity.js";
import { User } from "./models/User.js";

const charities = [
  {
    name: "Junior Fairway Futures",
    slug: "junior-fairway-futures",
    summary: "Funds youth golf access in underserved communities.",
    longDescription: "Supports coaching, transport, and kit for young players who would otherwise never enter the game.",
    impactMetric: "132 juniors sponsored",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
    totalRaised: 0
  },
  {
    name: "Birdies For Care",
    slug: "birdies-for-care",
    summary: "Pairs community golf events with cancer support programs.",
    longDescription: "Transforms subscription revenue into direct family grants and wellness services for people in treatment.",
    impactMetric: "380 care grants delivered",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    totalRaised: 0
  },
  {
    name: "Greens Without Barriers",
    slug: "greens-without-barriers",
    summary: "Improves accessibility for disabled golfers and clubs.",
    longDescription: "Invests in adaptive equipment and course accessibility so more players can take part.",
    impactMetric: "24 adaptive equipment packages funded",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
    totalRaised: 0
  }
];

async function run() {
  await connectDb();

  await Charity.deleteMany({});
  await User.deleteMany({});

  const createdCharities = await Charity.insertMany(charities);
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await User.create({
    name: "Platform Admin",
    email: "admin@golfcharity.local",
    passwordHash: adminPasswordHash,
    role: "admin",
    plan: "yearly",
    subscriptionStatus: "active",
    subscriptionAmount: 0,
    subscriptionRenewsAt: renewsAt
  });

  console.log("Seeded admin account and empty charity catalog.");
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
