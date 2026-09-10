/**
 * Unit tests for send & archive combined action.
 */
import { describe, it, expect } from "vitest";
import {
  executeSendAndArchive,
  shouldShowSendArchive,
  getSendArchiveLabel,
  getSendArchiveShortcut,
  isSendArchiveShortcut,
  getToastMessage,
  getToastVariant,
} from "@/lib/send-archive";

describe("send-archive", () => {
  describe("executeSendAndArchive", () => {
    it("executes send and archive", async () => {
      const result = await executeSendAndArchive({
        threadId: "t1",
        sendCallback: async () => true,
        archiveCallback: async () => true,
      });
      expect(result.sent).toBe(true);
      expect(result.archived).toBe(true);
      expect(result.message).toBe("Sent and archived");
    });

    it("handles send failure", async () => {
      const result = await executeSendAndArchive({
        threadId: "t1",
        sendCallback: async () => false,
        archiveCallback: async () => true,
      });
      expect(result.sent).toBe(false);
    });

    it("handles archive failure", async () => {
      const result = await executeSendAndArchive({
        threadId: "t1",
        sendCallback: async () => true,
        archiveCallback: async () => false,
      });
      expect(result.sent).toBe(true);
      expect(result.archived).toBe(false);
    });
  });

  describe("shouldShowSendArchive", () => {
    it("returns true when replying", () => {
      expect(shouldShowSendArchive(true, false)).toBe(true);
    });

    it("returns false for new composition", () => {
      expect(shouldShowSendArchive(false, true)).toBe(false);
    });
  });

  describe("getSendArchiveLabel", () => {
    it("returns default label", () => {
      expect(getSendArchiveLabel()).toBe("Send & Archive");
    });

    it("returns shortcut label", () => {
      expect(getSendArchiveLabel(true)).toContain("↵");
    });
  });

  describe("getSendArchiveShortcut", () => {
    it("returns Shift+Enter", () => {
      expect(getSendArchiveShortcut()).toBe("Shift+Enter");
    });
  });

  describe("isSendArchiveShortcut", () => {
    it("returns true for Shift+Enter", () => {
      expect(isSendArchiveShortcut({ key: "Enter", shiftKey: true } as KeyboardEvent)).toBe(true);
    });

    it("returns false for Enter alone", () => {
      expect(isSendArchiveShortcut({ key: "Enter", shiftKey: false } as KeyboardEvent)).toBe(false);
    });
  });

  describe("getToastMessage", () => {
    it("returns success message", () => {
      expect(getToastMessage({ sent: true, archived: true } as any)).toBe("Sent and archived");
    });

    it("returns error message", () => {
      expect(getToastMessage({ sent: false } as any)).toBe("Failed to send");
    });
  });

  describe("getToastVariant", () => {
    it("returns success", () => {
      expect(getToastVariant({ sent: true, archived: true } as any)).toBe("success");
    });

    it("returns error", () => {
      expect(getToastVariant({ sent: false } as any)).toBe("error");
    });
  });
});
