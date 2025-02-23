import winston from "winston";

const enumerateErrorFormat = winston.format((info: any) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

export const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.printf((info: any) => `${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});
