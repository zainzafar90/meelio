import { logger } from "..";

jest.spyOn(global.console, "log");

describe("@repo/logger", () => {
  it("prints a message", () => {
    logger.log("hello");
    expect(console.log).toHaveBeenCalled();
  });

  it("prints a warning", () => {
    logger.warn("warning");
    expect(console.log).toHaveBeenCalled();
  });

  it("prints an error", () => {
    logger.error("error");
    expect(console.log).toHaveBeenCalled();
  });
});
