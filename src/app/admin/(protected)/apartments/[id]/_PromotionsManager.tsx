"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RuleType = "SEASONAL" | "LENGTH_OF_STAY" | "LAST_MINUTE";

export interface RuleRow {
  id: string;
  type: RuleType;
  name: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  multiplier: number | null;
  minNights: number | null;
  discountPct: number | null;
  daysBeforeCheckIn: number | null;
}

const TYPE_LABEL: Record<RuleType, string> = {
  SEASONAL: "Сезонна цена",
  LENGTH_OF_STAY: "Дълъг престой",
  LAST_MINUTE: "Последна минута",
};

const EMPTY_FORM = {
  type: "SEASONAL" as RuleType,
  name: "",
  active: true,
  startDate: "",
  endDate: "",
  multiplier: "",
  minNights: "",
  discountPct: "",
  daysBeforeCheckIn: "",
};

export default function PromotionsManager({
  apartmentId,
  initialRules,
}: {
  apartmentId: string;
  initialRules: RuleRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rules, setRules] = useState(initialRules);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  function startEdit(rule: RuleRow) {
    setEditingId(rule.id);
    setShowForm(true);
    setError("");
    setForm({
      type: rule.type,
      name: rule.name,
      active: rule.active,
      startDate: rule.startDate?.slice(0, 10) ?? "",
      endDate: rule.endDate?.slice(0, 10) ?? "",
      multiplier: rule.multiplier !== null ? String(rule.multiplier) : "",
      minNights: rule.minNights !== null ? String(rule.minNights) : "",
      discountPct: rule.discountPct !== null ? String(rule.discountPct) : "",
      daysBeforeCheckIn: rule.daysBeforeCheckIn !== null ? String(rule.daysBeforeCheckIn) : "",
    });
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const body: Record<string, unknown> = {
        apartmentId,
        type: form.type,
        name: form.name,
        active: form.active,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        multiplier: form.multiplier === "" ? null : Number(form.multiplier),
        minNights: form.minNights === "" ? null : Number(form.minNights),
        discountPct: form.discountPct === "" ? null : Number(form.discountPct),
        daysBeforeCheckIn: form.daysBeforeCheckIn === "" ? null : Number(form.daysBeforeCheckIn),
      };
      if (editingId) body.id = editingId;
      const res = await fetch("/api/admin/promotions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Грешка при запис");
        return;
      }
      setRules((prev) =>
        editingId ? prev.map((r) => (r.id === editingId ? j.rule : r)) : [...prev, j.rule]
      );
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      router.refresh();
    });
  }

  async function remove(id: string) {
    if (!confirm("Да изтрия ли тази промоция?")) return;
    const res = await fetch("/api/admin/promotions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  const input =
    "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy/10 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy">Промоции и ценови правила</h3>
            <p className="text-xs text-navy/50">
              Сезонна цена: множител за период (0.85 = −15%). Отстъпките за дълъг престой и
              последна минута не се натрупват — прилага се по-голямата.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(EMPTY_FORM);
              setError("");
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-hover"
          >
            <Plus className="h-4 w-4" />
            Нова промоция
          </button>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-navy/10 bg-gray-50 px-4 py-3 text-sm"
            >
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                  rule.active ? "bg-gold/20 text-gold-deep" : "bg-gray-200 text-gray-500"
                )}
              >
                {TYPE_LABEL[rule.type]}
              </span>
              <span className="font-semibold text-navy">{rule.name}</span>
              {!rule.active && <span className="text-xs text-gray-500">(неактивна)</span>}
              <span className="ml-auto text-navy/60">
                {rule.type === "SEASONAL" &&
                  `${rule.startDate?.slice(0, 10)} → ${rule.endDate?.slice(0, 10)} · ×${Number(rule.multiplier).toFixed(2)}`}
                {rule.type === "LENGTH_OF_STAY" && `≥${rule.minNights} нощувки · −${rule.discountPct}%`}
                {rule.type === "LAST_MINUTE" && `≤${rule.daysBeforeCheckIn} дни преди настаняване · −${rule.discountPct}%`}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(rule)}
                  aria-label="Редактирай"
                  className="rounded p-1.5 text-navy/60 hover:bg-navy/5"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(rule.id)}
                  aria-label="Изтрий"
                  className="rounded p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="py-6 text-center text-sm text-navy/40">Няма промоции</p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-xl border border-gold/40 bg-white p-5">
          <h3 className="font-bold text-navy">{editingId ? "Редакция" : "Нова промоция"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-navy/60">Тип</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RuleType }))}
                className={input}
                disabled={!!editingId}
              >
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-navy/60">Име</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="напр. Лято 2027"
                className={input}
              />
            </div>
            {form.type === "SEASONAL" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">От дата</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">До дата</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">
                    Множител (1.30 = +30%, 0.85 = −15%)
                  </label>
                  <input type="number" step="0.05" min="0.1" value={form.multiplier} onChange={(e) => setForm((f) => ({ ...f, multiplier: e.target.value }))} className={input} />
                </div>
              </>
            )}
            {form.type === "LENGTH_OF_STAY" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">Мин. нощувки</label>
                  <input type="number" min="1" value={form.minNights} onChange={(e) => setForm((f) => ({ ...f, minNights: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">Отстъпка (%)</label>
                  <input type="number" min="1" max="90" value={form.discountPct} onChange={(e) => setForm((f) => ({ ...f, discountPct: e.target.value }))} className={input} />
                </div>
              </>
            )}
            {form.type === "LAST_MINUTE" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">Дни преди настаняване</label>
                  <input type="number" min="1" value={form.daysBeforeCheckIn} onChange={(e) => setForm((f) => ({ ...f, daysBeforeCheckIn: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-navy/60">Отстъпка (%)</label>
                  <input type="number" min="1" max="90" value={form.discountPct} onChange={(e) => setForm((f) => ({ ...f, discountPct: e.target.value }))} className={input} />
                </div>
              </>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 accent-[#0d1f35]"
            />
            Активна
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={isPending || !form.name}
              className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:bg-gold-pale disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Запази промените" : "Добави промоция"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-sm font-medium text-navy/60 hover:text-navy"
            >
              Отказ
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
