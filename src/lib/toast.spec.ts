import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "./toast";
import { toastManager } from "@/hooks/use-toast";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toast helper", () => {
  it("adds severity metadata when the payload is a string", () => {
    const addSpy = vi
      .spyOn(toastManager, "add")
      .mockImplementation(() => "toast-id");

    toast.error("Unable to sign in");

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Unable to sign in",
      }),
    );
  });

  it("provides default titles when only a description is supplied", () => {
    const addSpy = vi
      .spyOn(toastManager, "add")
      .mockImplementation(() => "toast-id");

    toast.success({ description: "Everything looks good" });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Success",
        description: "Everything looks good",
      }),
    );
  });

  it("normalizes promise options and returns the original result", async () => {
    const basePromise = Promise.resolve("done");

    const promiseSpy = vi
      .spyOn(toastManager, "promise")
      .mockImplementation(async (promise, options) => {
        expect(options.loading).toMatchObject({
          type: "loading",
          title: "Sending request...",
        });

        expect(typeof options.success).toBe("function");
        if (typeof options.success === "function") {
          expect(options.success("done")).toMatchObject({
            type: "success",
            title: "Success: done",
          });
        }

        expect(typeof options.error).toBe("function");
        if (typeof options.error === "function") {
          expect(options.error(new Error("Nope"))).toMatchObject({
            type: "error",
            title: "Error: Nope",
          });
        }

        return promise;
      });

    const result = await toast.promise(basePromise, {
      loading: "Sending request...",
      success: (value) => `Success: ${value}`,
      error: (error: Error) => `Error: ${error.message}`,
    });

    expect(result).toBe("done");
    expect(promiseSpy).toHaveBeenCalledTimes(1);
  });
});
