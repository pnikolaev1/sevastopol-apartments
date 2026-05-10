import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import * as speakeasy from "speakeasy";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().length(6),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 422 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true },
  });
  if (!admin?.totpSecret) return NextResponse.json({ error: "2FA not configured" }, { status: 400 });

  const verified = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: "base32",
    token: parsed.data.token,
    window: 1,
  });

  if (!verified) return NextResponse.json({ error: "Invalid code" }, { status: 403 });

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  return NextResponse.json({ ok: true });
}
