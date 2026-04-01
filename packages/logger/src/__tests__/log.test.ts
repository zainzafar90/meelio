import { logger } from "..";

let logSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

describe("@repo/logger", () => {
  beforeEach(() => {
    logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
    warnSpy = jest.spyOn(global.console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(global.console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("prints a message", () => {
    logger.log("hello");
    expect(logSpy).toHaveBeenCalledWith("logger: hello");
  });

  it("prints a warning", () => {
    logger.warn("warning");
    expect(warnSpy).toHaveBeenCalledWith("logger: warning");
  });

  it("prints an error", () => {
    logger.error("error");
    expect(errorSpy).toHaveBeenCalledWith("logger: error");
  });
});
