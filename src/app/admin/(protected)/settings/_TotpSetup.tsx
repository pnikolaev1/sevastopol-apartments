"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import Image from "next/image";

interface Props {
  totpEnabled: boolean;
}

interface SetupData {
  qrCodeUrl: string;
  secret: string;
}

export default function TotpSetup({ totpEnabled }: Props) {
  const [isPending, startTransition] = useTransition();
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [enabled, setEnabled] = useState(totpEnabled);

  async function startSetup() {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/totp/setup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
      } else {
        setError("Failed to generate 2FA setup");
      }
    });
  }

  async function verifyAndEnable() {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setSuccess("Two-factor authentication enabled");
        setEnabled(true);
        setSetupData(null);
        setToken("");
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Invalid code — please try again");
      }
    });
  }

  async function disable() {
    if (!confirm("Disable two-factor authentication? This will make your account less secure.")) return;
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/totp/verify", {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("Two-factor authentication disabled");
        setEnabled(false);
        setSetupData(null);
      } else {
        setError("Failed to disable 2FA");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {enabled ? (
            <ShieldCheck className="h-4 w-4 text-green-600" />
          ) : (
            <ShieldOff className="h-4 w-4 text-gray-400" />
          )}
          <h2 className="font-medium text-gray-900">Two-Factor Authentication</h2>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {!enabled && !setupData && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Add an extra layer of security. You&apos;ll need an authenticator app like Google Authenticator or Authy.
          </p>
          <button
            onClick={startSetup}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Set up 2FA
          </button>
        </div>
      )}

      {setupData && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          <div className="flex flex-col items-center gap-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCodeUrl} alt="2FA QR Code" width={200} height={200} className="rounded-lg border border-gray-200" />
            <p className="text-xs text-gray-500 text-center">
              Can&apos;t scan? Enter manually:<br />
              <code className="font-mono text-xs tracking-widest">{setupData.secret}</code>
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Enter 6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 tracking-widest text-center"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={verifyAndEnable}
              disabled={isPending || token.length !== 6}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm &amp; enable
            </button>
            <button
              onClick={() => setSetupData(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Your account is protected with two-factor authentication.</p>
          <button
            onClick={disable}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Disable 2FA
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}
    </div>
  );
}
