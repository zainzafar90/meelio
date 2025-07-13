import { accountService } from "../auth.service";
import { Provider } from "@/types/enums.types";
import { IAccessAndRefreshTokens } from "@/types/interfaces/resources";

jest.mock("@/db", () => {
  const sessionsStore: any[] = [];
  return {
    db: {
      query: {
        accounts: { findFirst: jest.fn().mockResolvedValue(undefined) },
        sessions: {
          findFirst: jest.fn(async ({ where }: any) =>
            sessionsStore.find(
              (s) =>
                s.accessToken === where.expressions[0].right.value &&
                !s.blacklisted,
            ),
          ),
        },
      },
      insert: jest.fn(() => ({
        values: jest.fn(async (val: any) => {
          sessionsStore.push({ ...val, id: `${sessionsStore.length}` });
        }),
      })),
      update: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      })),
    },
  };
});

describe("sessions", () => {
  const tokens = (t: string): IAccessAndRefreshTokens => ({
    access: { token: t, expires: new Date() },
    refresh: { token: t + "r", expires: new Date() },
  });

  test("multiple logins create distinct sessions", async () => {
    await accountService.updateAccountTokens(
      "u1",
      Provider.PASSWORD,
      tokens("a1"),
    );
    await accountService.updateAccountTokens(
      "u1",
      Provider.PASSWORD,
      tokens("a2"),
    );

    const { db } = await import("@/db");
    const count = (db.insert as jest.Mock).mock.calls.length;
    expect(count).toBe(2);
  });
});
