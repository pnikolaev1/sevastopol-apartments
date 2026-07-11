"use client";

import { useState, useTransition } from "react";
import { Loader2, KeyRound } from "lucide-react";

export default function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.next !== form.confirm) {
      setError("Новите пароли не съвпадат");
      return;
    }
    if (form.next.length < 8) {
      setError("Новата парола трябва да е поне 8 знака");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      if (res.ok) {
        setSuccess("Паролата е сменена успешно");
        setForm({ current: "", next: "", confirm: "" });
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Грешка при смяна на паролата");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-4 w-4 text-gray-500" />
        <h2 className="font-medium text-gray-900">Change Password</h2>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Current password</label>
          <input
            type="password"
            required
            value={form.current}
            onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.next}
            onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
          <input
            type="password"
            required
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}
