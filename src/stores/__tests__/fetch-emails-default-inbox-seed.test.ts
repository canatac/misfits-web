import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Email, EmailFolder } from "@/types/email";
import { performFetchEmails } from "@/stores/parts/email-store/fetch-emails";
import { emailRepository } from "@/lib/repositories";

vi.mock("@/lib/mail-api", () => ({
  hasMailIdentity: () => true,
}));

vi.mock("@/lib/repositories", () => ({
  emailRepository: {
    fetchEmails: vi.fn(),
  },
}));

describe("performFetchEmails default inbox seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("injects one test email when inbox API returns empty", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockResolvedValueOnce({ emails: [], total: 0 });

    const folders: EmailFolder[] = [
      { id: "inbox", name: "Inbox", icon: "Inbox", unreadCount: 0, totalCount: 0 },
    ];

    const state: {
      currentFolder: "inbox";
      loading: boolean;
      selectedEmailId: string | null;
      selectedEmailIds: Set<string>;
      folders: EmailFolder[];
      emails: Email[];
      error: string | null;
      _fetchGen: number;
    } = {
      currentFolder: "inbox" as const,
      loading: false,
      selectedEmailId: null,
      selectedEmailIds: new Set<string>(),
      folders,
      emails: [],
      error: null as string | null,
      _fetchGen: 0,
    };

    await performFetchEmails(
      {
        get: () => state,
        set: (partial) => Object.assign(state, partial),
      },
      "inbox",
      undefined
    );

    expect(state.emails).toHaveLength(1);
    expect(state.emails[0]?.id).toBe("inbox-seed-default-test-email");
    expect(state.folders[0]?.totalCount).toBe(1);
    expect(state.folders[0]?.unreadCount).toBe(1);
  });
});
