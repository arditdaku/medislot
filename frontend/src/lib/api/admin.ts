import apiClient from "@/lib/api-client";
import type { AdminStats } from "@/types/api";

/** Admin-only: aggregated dashboard statistics (GET /admin/stats). */
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/admin/stats");
  return data;
}
