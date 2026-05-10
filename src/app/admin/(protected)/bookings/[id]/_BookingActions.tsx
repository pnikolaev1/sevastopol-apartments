"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { Loader2, Save } from "lucide-react";

interface Props {
  booking: {
    id: string;
    status: BookingStatus;
    internalNotes: string;
  };
}

const actionLabels: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: "Mark Confirmed",
  CANCELLED: "Cancel Booking",
  REFUNDED: "Mark Refunded",
};

const actionStyles: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: "bg-green-600 hover:bg-green-700 text-white",
  CANCELLED: "bg-red-600 hover:bg-red-700 text-white",
  REFUNDED: "bg-gray-600 hover:bg-gray-700 text-white",
};

export default function BookingActions({ booking }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(booking.internalNotes);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableTransitions: BookingStatus[] = (() => {
    switch (booking.status) {
      case "PENDING":
        return ["CONFIRMED", "CANCELLED"];
      case "CONFIRMED":
        return ["CANCELLED", "REFUNDED"];
      case "CANCELLED":
        return ["REFUNDED"];
      default:
        return [];
    }
  })();

  async function changeStatus(newStatus: BookingStatus) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuccess(`Status updated to ${newStatus}`);
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Failed to update status");
      }
    });
  }

  async function saveNotes() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/bookings/${booking.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSuccess("Notes saved");
        router.refresh();
      } else {
        setError("Failed to save notes");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Status actions */}
      {availableTransitions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {availableTransitions.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={isPending}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${actionStyles[s] ?? "bg-gray-200 text-gray-700"}`}
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {actionLabels[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Internal notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Internal Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Notes visible only to admin…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={saveNotes}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save notes
          </button>
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
