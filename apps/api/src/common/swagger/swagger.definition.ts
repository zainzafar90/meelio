import { config } from "@/config/config";

export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Meelio API Documentation",
    version: "0.0.1",
    description: "API Documentation for Meelio",
    license: {
      name: "MIT",
      url: "https://github.com/zainzafar90/meelio.git",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
      description: "Development Server",
    },
  ],
};
