import { describe, it, expect } from "vitest";
import {
  contactCardReducer,
  initialState,
  showContactCard,
  hideContactCard,
  setContact,
  isContactCardVisible,
  getCurrentContact,
  getHoverDelay,
} from "@/lib/contact-card";

const SAMPLE_CONTACT = {
  id: "c1",
  name: "John Doe",
  email: "john@example.com",
  lastInteraction: "2026-09-10",
  sharedLabels: [{ id: "l1", name: "Work", color: "#C49B66" }],
  threadCount: 5,
};

describe("contact-card", () => {
  it("creates empty state", () => {
    expect(initialState.isVisible).toBe(false);
    expect(initialState.contact).toBeNull();
  });

  it("shows card", () => {
    const state = contactCardReducer(initialState, showContactCard(SAMPLE_CONTACT));
    expect(state.isVisible).toBe(true);
    expect(state.contact).toEqual(SAMPLE_CONTACT);
  });

  it("hides card", () => {
    let state = contactCardReducer(initialState, showContactCard(SAMPLE_CONTACT));
    state = contactCardReducer(state, hideContactCard());
    expect(state.isVisible).toBe(false);
  });

  it("sets contact", () => {
    const state = contactCardReducer(initialState, setContact(SAMPLE_CONTACT));
    expect(state.contact).toEqual(SAMPLE_CONTACT);
  });

  it("checks visibility", () => {
    expect(isContactCardVisible(initialState)).toBe(false);
  });

  it("gets current contact", () => {
    const state = contactCardReducer(initialState, showContactCard(SAMPLE_CONTACT));
    expect(getCurrentContact(state)).toEqual(SAMPLE_CONTACT);
  });

  it("gets hover delay", () => {
    expect(getHoverDelay(initialState)).toBe(300);
  });
});
