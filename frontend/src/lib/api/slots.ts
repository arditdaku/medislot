import apiClient from "@/lib/api-client";
import type { Slot } from "@/types/api";

/**
 * Fetch available slots for a provider on a given day.
 *
 * @param providerId Provider id.
 * @param date Optional day to query, formatted as `YYYY-MM-DD`. When omitted,
 *   all available slots for the provider are returned.
 */
export async function getSlots(providerId: number, date?: string): Promise<Slot[]> {
  const params: Record<string, string | number> = { provider_id: providerId };
  if (date) params.date = date;
  const { data } = await apiClient.get<Slot[]>("/slots", { params });
  return data;
}

/** Block a slot (admin or owning doctor only). */
export async function blockSlot(id: string): Promise<Slot> {
  const { data } = await apiClient.patch<Slot>(`/slots/${id}/block`);
  return data;
}

/** Unblock a slot (admin or owning doctor only). */
export async function unblockSlot(id: string): Promise<Slot> {
  const { data } = await apiClient.patch<Slot>(`/slots/${id}/unblock`);
  return data;
}