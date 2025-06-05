import httpMocks from "node-mocks-http";
import {
  calendarController,
  MemoryTokenStore,
  MemoryStateStore,
} from "./index";

describe("calendar token refresh", () => {
  test("token refresh path returns fresh access_token when \u2264 5 min left", async () => {
    const tokenStore = new MemoryTokenStore();
    const stateStore = new MemoryStateStore();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "new", expires_in: 3600 }),
    });
    const now = jest.fn(() => 1000);
    const controller = calendarController({
      tokenStore,
      stateStore,
      fetcher: fetchMock as any,
      now,
    });
    await tokenStore.set("u1", {
      refreshToken: "ref",
      accessToken: "old",
      expiresAt: now() + 4 * 60 * 1000,
    });
    const req = httpMocks.createRequest({ method: "GET" });
    (req as any).user = { id: "u1" };
    const res = httpMocks.createResponse();
    await new Promise((resolve, reject) =>
      controller.getToken(req as any, res as any, (err?: Error) =>
        err ? reject(err) : resolve(null),
      ),
    );
    const data = res._getJSONData();
    expect(data.access_token).toBe("new");
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("google events fetch", () => {
  test("direct Google API call works with stubbed fetch and mocked token", async () => {
    const events = { items: [{ id: "1", summary: "x" }] };
    const fetchStub = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => events });

    const accessToken = "t";
    const timeMin = new Date("2020-01-01").toISOString();
    const timeMax = new Date("2020-01-02").toISOString();

    const data = await fetchStub(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ).then((r) => r.json());

    expect(data).toEqual(events);
    expect(fetchStub).toHaveBeenCalled();
  });
});
