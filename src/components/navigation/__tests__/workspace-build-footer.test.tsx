import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { WorkspaceBuildFooter } from "../workspace-build-footer";

// misfits-web#1254: on production the server reads the build labels when it
// runs and the browser when the bundle was built; the text of the footer
// differed and React threw #418 on /mail.
describe("WorkspaceBuildFooter", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION", "misfits-web@1111111aaaaaaa");
    vi.stubEnv("NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION", "reimagined-guide@2222222bbbbbbb");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renders the same first text whatever the labels of the environment", () => {
    const withLabels = renderToString(<WorkspaceBuildFooter />);
    vi.stubEnv("NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION", "");
    vi.stubEnv("NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION", "");
    expect(renderToString(<WorkspaceBuildFooter />)).toBe(withLabels);
    expect(withLabels).not.toContain("11111");
    expect(withLabels).not.toContain("22222");
  });

  it("shows the labels of the environment once mounted", async () => {
    render(<WorkspaceBuildFooter />);
    await waitFor(() => expect(screen.getByText(/@11111/)).toBeTruthy());
    expect(screen.getByText(/@22222/)).toBeTruthy();
  });
});
