import { NextResponse } from "next/server";
import { z } from "zod";
import { contactRatelimit, getIp } from "@/lib/ratelimit";
import { sendContactEmail } from "@/lib/email/templates";

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const ip = getIp(request);
  const { success } = await contactRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  await sendContactEmail(parsed.data);

  return NextResponse.json({ ok: true });
}
