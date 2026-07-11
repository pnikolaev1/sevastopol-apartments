"use client";

import { useState, useTransition } from "react";
import { Loader2, MailCheck, ShieldCheck, ShieldOff } from "lucide-react";

interface Props {
  emailOtpEnabled: boolean;
  email: string;
}

export default function EmailOtpSetup({ emailOtpEnabled, email }: Props) {
  const [isPending, startTransition] = useTransition();
  const [codeSent, setCodeSent] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [enabled, setEnabled] = useState(emailOtpEnabled);

  async function sendCode() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/email-2fa/setup", { method: "POST" });
      if (res.ok) {
        setCodeSent(true);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Грешка при изпращане на кода");
      }
    });
  }

  async function verifyAndEnable() {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/email-2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setSuccess("Имейл 2FA е активирана");
        setEnabled(true);
        setCodeSent(false);
        setToken("");
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Невалиден код — опитайте отново");
      }
    });
  }

  async function disable() {
    if (!confirm("Да деактивирам ли имейл 2FA? Това прави акаунта по-незащитен.")) return;
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/email-2fa/verify", { method: "DELETE" });
      if (res.ok) {
        setSuccess("Имейл 2FA е деактивирана");
        setEnabled(false);
        setCodeSent(false);
      } else {
        setError("Грешка при деактивиране");
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
          <h2 className="font-medium text-gray-900">Двуфакторна автентикация (имейл)</h2>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {enabled ? "Активна" : "Неактивна"}
        </span>
      </div>

      {!enabled && !codeSent && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            При активирана защита входът изисква 6-цифрен код, изпратен на <strong>{email}</strong>, в допълнение към паролата.
          </p>
          <button
            onClick={sendCode}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Активирай имейл 2FA
          </button>
        </div>
      )}

      {!enabled && codeSent && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800">
              Изпратихме 6-цифрен код на <strong>{email}</strong>. Въведете го по-долу, за да потвърдите, че пощата получава кодове. Валиден е 10 минути.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Въведете 6-цифрения код</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 tracking-widest text-center"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={verifyAndEnable}
              disabled={isPending || token.length !== 6}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Потвърди и активирай
            </button>
            <button
              onClick={sendCode}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Изпрати нов код
            </button>
            <button
              onClick={() => {
                setCodeSent(false);
                setToken("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >Отказ</button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Входът изисква парола плюс код, изпратен на <strong>{email}</strong>.
          </p>
          <button
            onClick={disable}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Деактивирай имейл 2FA
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}
    </div>
  );
}
