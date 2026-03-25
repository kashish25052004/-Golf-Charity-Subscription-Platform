import dotenv from "dotenv";

dotenv.config();

function cleanEnv(value, fallback) {
  return (value || fallback || "").replace(/[\r\n\t]/g, "").trim();
}

export const config = {
  port: cleanEnv(process.env.PORT, "5000") || 5000,
  nodeEnv: cleanEnv(process.env.NODE_ENV, "development"),
  mongoUri: cleanEnv(process.env.MONGO_URI, "mongodb://127.0.0.1:27017/golf-charity"),
  jwtSecret: cleanEnv(process.env.JWT_SECRET, "change-me"),
  clientUrl: cleanEnv(process.env.CLIENT_URL, "http://localhost:5173")
};

export const allowedOrigins = [
  config.clientUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);
