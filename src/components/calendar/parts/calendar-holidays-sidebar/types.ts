export interface CountryOption {
  code: string;
  label: string;
}

export interface PublicHolidayApiItem {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

export interface NagerCountryItem {
  countryCode: string;
  name: string;
}

export interface RestCountryItem {
  cca2: string;
  name?: { common?: string };
  translations?: { fra?: { common?: string } | string };
}

export interface HolidayEventInput {
  title: string;
  description: string;
  start: string;
  end: string;
  eventType: "reminder";
  color: string;
  location: string;
}

export function holidayKey(date: string, title: string): string {
  return `${date}|${title.trim().toLowerCase()}`;
}

export const SMART_TASKS = [
  "Répondre au contrat Q4",
  "Valider copy onboarding mail",
  "Revue sécurité du matin",
  "Synchroniser roadmap sprint",
];
