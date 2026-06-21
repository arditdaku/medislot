import apiClient from "@/lib/api-client";
import type { AdminQueueAppointment, AdminStats, AppointmentStatus } from "@/types/api";

/** Admin-only: aggregated dashboard statistics (GET /admin/stats). */
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/admin/stats");
  return data;
}

/**
 * Admin-only: a day's appointment queue (GET /admin/queue), ordered by slot
 * start time. Defaults to today; pass `date` (YYYY-MM-DD) for another day.
 * Optional status filter.
 */
export async function getAdminQueue(
  status?: AppointmentStatus,
  date?: string,
): Promise<AdminQueueAppointment[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (date) params.date = date;
  const { data } = await apiClient.get<AdminQueueAppointment[]>("/admin/queue", {
    params,
  });
  return data;
}
