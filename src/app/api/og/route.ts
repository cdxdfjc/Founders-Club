import { NextResponse } from "next/server";
import { fetchOg } from "@/lib/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  const data = await fetchOg(url);

  if (!data) {
    return NextResponse.json({ error: "could not fetch" }, { status: 422 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
