import dotenv from "dotenv";
import { logger } from "@repo/logger";

import { config } from "@/config/config";

import { createServer } from "./server";

dotenv.config();

const port = config.port || 3001;
const server = createServer();

server.listen(port, () => {
  logger.info(`api running on ${port}`);
});
