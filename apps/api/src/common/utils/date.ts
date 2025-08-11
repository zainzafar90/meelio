import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export function parseNullableDate(
  input: string | number | Date | null | undefined,
  fieldName: string = "date"
): Date | null | undefined {
  if (input === undefined) return undefined;
  if (input === null) return null;

  try {
    const parsedDate =
      typeof input === "number" ? new Date(input) : input instanceof Date ? input : new Date(input);

    if (isNaN(parsedDate.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${fieldName} format: ${input}`);
    }

    return parsedDate;
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${fieldName} format: ${input}`);
  }
}

