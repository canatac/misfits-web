import { describe, expect, it, vi, beforeEach } from "vitest";
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

describe("performFetchEmails issue-269 inbox auth guard 404", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps 404 error to auth guard regression message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("Failed to fetch emails: 404"));

    const folders = [
      { id: "inbox", name: "Inbox", icon: "Inbox", unreadCount: 0, totalCount: 0 },
    ];

    const state = {
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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
    expect(state.emails).toHaveLength(0);
  });

  it("maps verbose 404 error to auth guard regression message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(
      new Error("Backend unexpected response while loading inbox (status 404 Not Found)")
    );

    const folders = [
      { id: "inbox", name: "Inbox", icon: "Inbox", unreadCount: 0, totalCount: 0 },
    ];

    const state = {
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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
  });

  it("keeps non-404 backend errors unchanged", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("Failed to fetch emails: 500"));

    const folders = [
      { id: "inbox", name: "Inbox", icon: "Inbox", unreadCount: 0, totalCount: 0 },
    ];

    const state = {
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

    expect(state.error).toBe("Failed to fetch emails: 500");
  });
});
