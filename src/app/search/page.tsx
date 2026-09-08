import { redirect } from "next/navigation";

interface SearchPageProps {
  searchParams?: {
    q?: string | string[];
    query?: string | string[];
  };
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const candidate = value.find((entry) => entry.trim());
    return candidate ?? null;
  }
  return null;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = firstParam(searchParams?.q) ?? firstParam(searchParams?.query);
  const target = query
    ? `/mail?search=${encodeURIComponent(query)}`
    : "/mail";
  redirect(target);
}
