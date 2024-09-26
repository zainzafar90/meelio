import mongoose from "mongoose";

import { createServer } from "./server";
import { logger } from "@repo/logger";
import config from "./config/config";

const port = process.env.PORT || 3001;
const server = createServer();

mongoose.connect(config.mongoose.url).then(() => {
  logger.log("Connected to MongoDB");
  server.listen(port, () => {
    logger.log(`api running on ${port}`);
  });
});
