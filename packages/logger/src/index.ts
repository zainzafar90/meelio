const log = (str: any) => {
  console.log("logger: " + str);
};

const warn = (str: any) => {
  console.warn("logger: " + str);
};

const error = (str: any) => {
  console.error("logger: " + str);
};

export const logger = {
  log,
  warn,
  error,
};
