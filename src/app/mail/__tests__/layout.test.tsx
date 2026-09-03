import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MailLayout from "@/app/mail/layout";

describe("MailLayout", () => {
  it("returns children without adding a nested shell wrapper", () => {
    render(
      <MailLayout>
        <section data-testid="mail-page-root">Mail page</section>
      </MailLayout>
    );

    expect(screen.getByTestId("mail-page-root")).toBeTruthy();
    expect(screen.queryByTestId("mail-layout")).toBeNull();
  });
});
