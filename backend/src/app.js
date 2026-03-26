import cors from "cors";
import express from "express";
import { config } from "./config.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import subscriberRoutes from "./routes/subscriber.js";

export const app = express();

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json());

app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/subscriber", subscriberRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

