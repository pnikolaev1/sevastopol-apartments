import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { verifyLoginCode } from "@/lib/auth/email-otp";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().length(6),
});

/** Confirms the enrollment code and enables email-code 2FA. */
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
    return NextResponse.json({ error: "Invalid code" }, { status: 422 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.user.id } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const verified = await verifyLoginCode(admin, parsed.data.token);
  if (!verified) return NextResponse.json({ error: "Invalid or expired code" }, { status: 403 });

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { emailOtpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

/** Disables email-code 2FA and clears any pending code. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: {
      emailOtpEnabled: false,
      loginOtpHash: null,
      loginOtpSentAt: null,
      loginOtpAttempts: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
