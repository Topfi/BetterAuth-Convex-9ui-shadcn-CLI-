import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleRateLimitResponse } from "./auth-client-rate-limit";

vi.mock("@/lib/toast", () => ({
  toast: {
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const toastModulePromise = import("@/lib/toast");

beforeEach(async () => {
  const { toast } = await toastModulePromise;
  (toast.warning as unknown as vi.Mock).mockReset();
  (toast.info as unknown as vi.Mock).mockReset();
});

describe("handleRateLimitResponse", () => {
  it("surfaces retry information via toast", async () => {
    const headers = new Headers();
    headers.set("X-Retry-After", "12");
    const response = new Response("{}", { status: 429, headers });

    const handled = await handleRateLimitResponse(response);

    expect(handled).toBe(true);
    const { toast } = await toastModulePromise;
    expect(toast.warning).toHaveBeenCalledWith({
      title: "Too many attempts",
      description: "Try again in 12 seconds.",
    });
  });

  it("ignores non-rate-limit responses", async () => {
    const response = new Response("{}", { status: 400 });

    const handled = await handleRateLimitResponse(response);

    expect(handled).toBe(false);
    const { toast } = await toastModulePromise;
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
