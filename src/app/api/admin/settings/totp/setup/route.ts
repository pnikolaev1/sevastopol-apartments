import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const secret = speakeasy.generateSecret({
    name: `Sevapart Admin (${admin.email})`,
    length: 32,
  });

  // Store the pending secret (not yet enabled)
  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { totpSecret: secret.base32, totpEnabled: false },
  });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url ?? "");

  return NextResponse.json({
    qrCodeUrl,
    secret: secret.base32,
  });
}
