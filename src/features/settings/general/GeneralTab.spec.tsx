import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GeneralTab from "./GeneralTab";

describe("GeneralTab", () => {
  it("renders user details", () => {
    const { container } = render(
      <GeneralTab
        currentUser={{ email: "user@example.com", image: null, name: "Alex" }}
        identity={{ usernameDisplay: "alex" }}
        isLoading={false}
      />,
    );

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getAllByText(/alex/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("user@example.com").length).toBeGreaterThan(0);
    const fallback = container.querySelector("[data-slot='avatar-fallback']");
    expect(fallback?.textContent).toBe("AL");
  });

  it("renders skeleton when loading", () => {
    const { container } = render(
      <GeneralTab currentUser={undefined} identity={undefined} isLoading />,
    );

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(2);
  });
});
