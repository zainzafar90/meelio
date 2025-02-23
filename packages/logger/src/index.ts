const log = (str: any) => {
  console.log("logger: " + str);
};

const info = (str: any) => {
  console.info("logger: " + str);
};

const warn = (str: any) => {
  console.warn("logger: " + str);
};

const error = (str: any) => {
  console.error("logger: " + str);
};

export const logger = {
  log,
  info,
  warn,
  error,
};
