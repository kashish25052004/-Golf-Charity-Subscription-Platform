import { app } from "./app.js";
import { config } from "./config.js";
import { connectDb } from "./db.js";

async function start() {
  await connectDb();
  app.listen(config.port, () => {
    console.log(`API running on port ${config.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
