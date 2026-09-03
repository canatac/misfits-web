import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const webLabel =
    process.env.MISFITS_WEB_BUILD_VERSION ||
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION ||
    "unknown";

  const backendLabel =
    process.env.REIMAGINED_GUIDE_BUILD_VERSION ||
    process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION ||
    "unknown";

  return NextResponse.json(
    {
      webLabel,
      backendLabel,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
