import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("convex config", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("registers convex components", async () => {
    const useMock = vi.fn();
    const defineComponentMock = vi.fn();

    vi.doMock("convex/server", () => ({
      defineApp: () => ({
        use: useMock,
      }),
      defineComponent: defineComponentMock,
    }));

    const agentStub = Symbol("agent");
    const betterAuthStub = Symbol("betterAuth");
    const resendStub = Symbol("resend");
    const cronsStub = Symbol("crons");

    vi.doMock("@convex-dev/agent/convex.config", () => ({
      default: agentStub,
    }));

    vi.doMock("@convex-dev/better-auth/convex.config", () => ({
      default: betterAuthStub,
    }));

    vi.doMock("@convex-dev/resend/convex.config", () => ({
      default: resendStub,
    }));

    vi.doMock("@convex-dev/crons/convex.config", () => ({
      default: cronsStub,
    }));

    await import("./convex.config");

    expect(useMock).toHaveBeenCalledWith(agentStub);
    expect(useMock).toHaveBeenCalledWith(betterAuthStub);
    expect(useMock).toHaveBeenCalledWith(resendStub);
    expect(useMock).toHaveBeenCalledWith(cronsStub);
    expect(useMock).toHaveBeenCalledTimes(4);
  });
});
