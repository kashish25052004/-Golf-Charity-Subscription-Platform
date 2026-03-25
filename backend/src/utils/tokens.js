import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

