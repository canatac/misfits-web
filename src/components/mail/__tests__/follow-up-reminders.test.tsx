"use client";

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FollowUpList } from "../follow-up-list";
import { EmailToolbar } from "../email-view/email-toolbar";
import {
  REMINDER_INTERVALS_HOURS,
  DEFAULT_REMINDER_HOURS,
  getReminderHours,
  setReminderHours,
} from "@/hooks/use-follow-ups";

describe("follow-up reminders (issue #1043)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("exposes the configurable reminder intervals", () => {
    expect(REMINDER_INTERVALS_HOURS).toEqual([24, 48, 168]);
    expect(DEFAULT_REMINDER_HOURS).toBe(48);
  });

  it("persists the reminder interval in localStorage", () => {
    setReminderHours(24);
    expect(getReminderHours()).toBe(24);
    setReminderHours(168);
    expect(getReminderHours()).toBe(168);
  });

  it("falls back to the default interval for an unknown value", () => {
    window.localStorage.setItem("misfits.followUpReminderHours", "999");
    expect(getReminderHours()).toBe(DEFAULT_REMINDER_HOURS);
  });

  it("shows the reminder interval selector in the follow-up list", () => {
    render(<FollowUpList />);
    expect(screen.getByTestId("followup-reminder-interval")).toBeTruthy();
  });

  it("renders the follow-up toggle in the email toolbar", () => {
    render(
      <EmailToolbar
        isStarred={false}
        isFollowUp={false}
        onArchive={() => {}}
        onDelete={() => {}}
        onMarkUnread={() => {}}
        onReply={() => {}}
        onReplyAll={() => {}}
        onForward={() => {}}
        onToggleStar={() => {}}
        onToggleFollowUp={() => {}}
        onHermesSummarize={() => {}}
        onHermesReplyDraft={() => {}}
        onHermesTranslate={() => {}}
        onHermesTodos={() => {}}
        onFindInPage={() => {}}
        isReadingActive={false}
        onToggleReadingMode={() => {}}
      />
    );
    expect(screen.getByTestId("email-followup-toggle")).toBeTruthy();
  });

  it("calls onToggleFollowUp when the toolbar action is clicked", () => {
    let clicked = 0;
    render(
      <EmailToolbar
        isStarred={false}
        isFollowUp={false}
        onArchive={() => {}}
        onDelete={() => {}}
        onMarkUnread={() => {}}
        onReply={() => {}}
        onReplyAll={() => {}}
        onForward={() => {}}
        onToggleStar={() => {}}
        onToggleFollowUp={() => {
          clicked += 1;
        }}
        onHermesSummarize={() => {}}
        onHermesReplyDraft={() => {}}
        onHermesTranslate={() => {}}
        onHermesTodos={() => {}}
        onFindInPage={() => {}}
        isReadingActive={false}
        onToggleReadingMode={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId("email-followup-toggle"));
    expect(clicked).toBe(1);
  });
});
