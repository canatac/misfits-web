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

  it("maps inbox 404 to auth-guard regression message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("Failed to fetch emails: 404"));

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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
    expect(state.emails).toHaveLength(0);
  });

  it("keeps non-404 backend errors unchanged", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("Failed to fetch emails: 500"));

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

    expect(state.error).toBe("Failed to fetch emails: 500");
    expect(state.emails).toHaveLength(0);
  });

  it("uses generic message for non-Error failures", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce("network exploded");

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

    expect(state.error).toBe("Failed to fetch emails");
    expect(state.emails).toHaveLength(0);
  });

  it("maps 404 even when backend error text is verbose", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(
      new Error("Backend unexpected response while loading inbox (status 404 Not Found)")
    );

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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
  });

  it("maps uppercase HTTP 404 token to auth-guard message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("HTTP 404 from inbox endpoint"));

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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
  });

  it("maps dotted 404 token to auth-guard message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("Failed to fetch emails: 404."));

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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
  });

  it("maps bracketed 404 token to auth-guard message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(new Error("Upstream error [404] inbox unavailable"));

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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
  });

  it("maps status-code 404 token to auth-guard message", async () => {
    const fetchEmailsMock = vi.mocked(emailRepository.fetchEmails);
    fetchEmailsMock.mockRejectedValueOnce(
      new Error("request failed with status code 404 from upstream")
    );

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

    expect(state.error).toBe(
      "Inbox auth guard unexpected response (404). Please sign in again."
    );
  });
});
