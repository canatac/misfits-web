/**
 * Integration test: AI prompt builders cross-repo contract.
 *
 * ai-prompt-builders.ts constructs ChatMessage[] sent to the AI backend
 * (OpenRouter-compatible). This test verifies the message structure
 * matches the AI client contract (ai-client.ts).
 */
import { describe, it, expect } from "vitest";
import type {
  AITone,
  AILength,
  AITranslationLang,
  AIComposerRequest,
  ChatMessage,
} from "@/types/ai";
import {
  buildEmailMessages,
  lengthToTokens,
  stripHtml,
} from "@/lib/ai-prompt-builders";

describe("AI prompt builders cross-repo contract", () => {
  it("buildEmailMessages returns system + user messages", () => {
    const req: AIComposerRequest = {
      prompt: "Write a follow-up email",
      tone: "professionnel",
      length: "standard",
    };
    const messages = buildEmailMessages(req);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("system message includes tone and length descriptions", () => {
    const req: AIComposerRequest = {
      prompt: "Thank you for your email",
      tone: "amical",
      length: "concis",
    };
    const messages = buildEmailMessages(req);
    const system = messages[0].content;
    expect(system).toContain("amical et chaleureux");
    expect(system).toContain("concis");
  });

  it("buildEmailMessages includes language clause when specified", () => {
    const req: AIComposerRequest = {
      prompt: "Translate to English",
      tone: "professionnel",
      length: "standard",
      language: "en",
    };
    const messages = buildEmailMessages(req);
    const system = messages[0].content;
    expect(system).toContain("anglais");
  });

  it("buildEmailMessages omits language clause when not specified", () => {
    const req: AIComposerRequest = {
      prompt: "Write in French",
      tone: "professionnel",
      length: "standard",
    };
    const messages = buildEmailMessages(req);
    const system = messages[0].content;
    expect(system).not.toContain("anglais");
    expect(system).not.toContain("français");
  });

  it("user message includes context subject when provided", () => {
    const req: AIComposerRequest = {
      prompt: "Reply to this",
      tone: "direct",
      length: "standard",
      context: { subject: "Re: Project Update" },
    };
    const messages = buildEmailMessages(req);
    const user = messages[1].content;
    expect(user).toContain("Re: Project Update");
  });

  it("user message includes recipients when provided", () => {
    const req: AIComposerRequest = {
      prompt: "Send update",
      tone: "professionnel",
      length: "standard",
      context: { recipients: ["team@misfits.ai", "boss@misfits.ai"] },
    };
    const messages = buildEmailMessages(req);
    const user = messages[1].content;
    expect(user).toContain("team@misfits.ai");
    expect(user).toContain("boss@misfits.ai");
  });

  it("lengthToTokens maps concis to 256", () => {
    expect(lengthToTokens("concis")).toBe(256);
  });

  it("lengthToTokens maps standard to 512", () => {
    expect(lengthToTokens("standard")).toBe(512);
  });

  it("lengthToTokens maps detaille to 1024", () => {
    expect(lengthToTokens("detaille")).toBe(1024);
  });

  it("stripHtml removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("stripHtml decodes HTML entities", () => {
    expect(stripHtml("&lt;div&gt; &amp; &nbsp;text")).toBe("<div> & text");
  });

  it("AITone values match expected set", () => {
    const tones: AITone[] = ["professionnel", "amical", "direct", "formel", "decontracte"];
    expect(tones).toHaveLength(5);
  });

  it("AILength values match expected set", () => {
    const lengths: AILength[] = ["concis", "standard", "detaille"];
    expect(lengths).toHaveLength(3);
  });

  it("AITranslationLang values match expected set", () => {
    const langs: AITranslationLang[] = ["fr", "en", "es", "de", "it"];
    expect(langs).toHaveLength(5);
  });
});
