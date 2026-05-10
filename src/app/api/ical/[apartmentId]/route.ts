import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateIcalFeed } from "@/lib/ical/outbound";
import { verifyIcalToken } from "@/lib/ical/sync";

export const runtime = "nodejs";
export const revalidate = 900; // 15 min cache

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  const { apartmentId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { icalSecret: true },
  });

  if (!apt) {
    return new NextResponse("Not found", { status: 404 });
  }

  const valid = verifyIcalToken(apartmentId, apt.icalSecret, token);
  if (!valid) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const feed = await generateIcalFeed(apartmentId);

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${apartmentId}.ics"`,
      "Cache-Control": "public, max-age=900",
    },
  });
}
