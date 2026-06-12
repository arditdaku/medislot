import apiClient from "@/lib/api-client";
import type { Slot } from "@/types/api";

/**
 * Fetch available slots for a provider on a given day.
 *
 * @param providerId Provider id.
 * @param date Day to query, formatted as `YYYY-MM-DD`.
 */
export async function getSlots(providerId: number, date: string): Promise<Slot[]> {
  const { data } = await apiClient.get<Slot[]>("/slots", {
    params: { provider_id: providerId, date },
  });
  return data;
}
