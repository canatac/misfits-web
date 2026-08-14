"use client";
// contact-utils.ts — extracted Sprint 3-3
import type { Contact, ContactFrequency, ContactGroup } from "@/types/contact";

export function genId(prefix = "ct"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function contactInitials(name: string, email: string): string {
  const base = name || email.split("@")[0] || "?";
  const parts = base.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function deriveFrequency(dates: string[]): ContactFrequency {
  if (dates.length === 0) return "never";
  const last = Math.max(...dates.map((d) => new Date(d).getTime()));
  if (Number.isNaN(last)) return "never";
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  if (days <= 1) return "daily";
  if (days <= 7) return "weekly";
  if (days <= 30) return "monthly";
  return "rarely";
}

export const FREQUENCY_LABELS: Record<ContactFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  rarely: "Rarely",
  never: "Never",
};

export const nowISO = () => new Date().toISOString();

