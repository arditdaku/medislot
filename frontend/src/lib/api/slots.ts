import apiClient from "@/lib/api-client";
import type {
  Slot,
  SlotGeneratePayload,
  SlotGenerateRangePayload,
} from "@/types/api";

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

/**
 * Generate slots for a provider on a given day (admin only, POST
 * /slots/generate). The backend uses the provider's configured working hours
 * for that weekday and skips slots that already exist.
 */
export async function generateSlots(
  payload: SlotGeneratePayload,
): Promise<Slot[]> {
  const { data } = await apiClient.post<Slot[]>("/slots/generate", payload);
  return data;
}

/**
 * Generate slots for every working day in an inclusive date range (admin only,
 * POST /slots/generate-range). Days the provider does not work are skipped
 * automatically, so e.g. Mon→Fri can be generated in one request.
 */
export async function generateSlotsRange(
  payload: SlotGenerateRangePayload,
): Promise<Slot[]> {
  const { data } = await apiClient.post<Slot[]>("/slots/generate-range", payload);
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