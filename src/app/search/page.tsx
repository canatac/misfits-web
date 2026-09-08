import { redirect } from "next/navigation";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
    query?: string | string[];
  }>;
}

async function firstParam(value: string | string[] | undefined): Promise<string | null> {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const candidate = value.find((entry) => entry.trim());
    return candidate ?? null;
  }
  return null;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = await firstParam(params?.q) ?? await firstParam(params?.query);
  const target = query
    ? `/mail?search=${encodeURIComponent(query)}`
    : "/mail";
  redirect(target);
}
