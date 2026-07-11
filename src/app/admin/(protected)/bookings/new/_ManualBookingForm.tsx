"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AptOption {
  id: string;
  name: string;
  maxGuests: number;
}

export default function ManualBookingForm({ apartments }: { apartments: AptOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    apartmentId: apartments[0]?.id ?? "",
    checkIn: "",
    checkOut: "",
    guestCount: 2,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    totalEur: "",
    internalNotes: "",
  });

  const apt = apartments.find((a) => a.id === form.apartmentId);
  const input =
    "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
  const label = "mb-1 block text-xs font-bold uppercase text-navy/60";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          totalEur: form.totalEur === "" ? undefined : Number(form.totalEur),
          email: form.email || undefined,
          phone: form.phone || undefined,
          internalNotes: form.internalNotes || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Грешка при създаване на резервацията");
        return;
      }
      router.push(`/admin/bookings/${j.booking.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Апартамент</label>
          <select
            value={form.apartmentId}
            onChange={(e) => setForm((f) => ({ ...f, apartmentId: e.target.value }))}
            className={input}
          >
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Настаняване</label>
          <input type="date" required value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} className={input} />
        </div>
        <div>
          <label className={label}>Напускане</label>
          <input type="date" required min={form.checkIn || undefined} value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} className={input} />
        </div>
        <div>
          <label className={label}>Брой гости (макс. {apt?.maxGuests ?? "—"})</label>
          <input type="number" min={1} max={apt?.maxGuests ?? 8} required value={form.guestCount} onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))} className={input} />
        </div>
        <div>
          <label className={label}>Обща цена (€) — празно = автоматична</label>
          <input type="number" min={0} step="0.01" value={form.totalEur} onChange={(e) => setForm((f) => ({ ...f, totalEur: e.target.value }))} className={input} />
        </div>
        <div>
          <label className={label}>Име</label>
          <input type="text" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={input} />
        </div>
        <div>
          <label className={label}>Фамилия</label>
          <input type="text" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={input} />
        </div>
        <div>
          <label className={label}>Имейл (по избор)</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={input} />
        </div>
        <div>
          <label className={label}>Телефон (по избор)</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Вътрешни бележки</label>
          <textarea rows={3} value={form.internalNotes} onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))} className={`${input} resize-y`} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-navy hover:bg-gold-pale disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Създай резервация
      </button>
    </form>
  );
}
