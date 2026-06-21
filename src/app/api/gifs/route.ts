import { NextRequest, NextResponse } from "next/server";

const GIPHY_KEY = process.env.GIPHY_API_KEY ?? process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? "dc6zaTOxFJmzC";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const endpoint = q.trim()
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=9&rating=g&lang=fr`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=9&rating=g`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ data: [] }, { status: 200 });
    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (json.data ?? []).map((g: any) => ({
      id: g.id,
      url: g.images.original.url,
      preview: g.images.fixed_height_small.url,
    }));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
