/**
 * Guest allocation for multi-apartment (group) bookings.
 *
 * Every selected apartment gets at least one guest, the rest are filled by
 * capacity in selection order. Tourist tax is linear in guests, so however
 * the group is split the combined total stays the same — the allocation only
 * decides each booking's own guestCount/receipt.
 */
export interface AllocatableApartment {
  id: string;
  maxGuests: number;
}

export function allocateGuests(
  totalGuests: number,
  apartments: AllocatableApartment[]
): Map<string, number> | null {
  const capacity = apartments.reduce((s, a) => s + a.maxGuests, 0);
  if (totalGuests > capacity) return null;
  if (totalGuests < apartments.length) return null; // an empty apartment makes no sense

  const alloc = new Map<string, number>(apartments.map((a) => [a.id, 1]));
  let remaining = totalGuests - apartments.length;
  for (const apt of apartments) {
    if (remaining <= 0) break;
    const extra = Math.min(remaining, apt.maxGuests - 1);
    alloc.set(apt.id, 1 + extra);
    remaining -= extra;
  }
  return remaining === 0 ? alloc : null;
}
