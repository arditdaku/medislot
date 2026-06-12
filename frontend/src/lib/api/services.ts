import apiClient from "@/lib/api-client";
import type { Service } from "@/types/api";

/** Fetch all bookable services. */
export async function getServices(): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>("/services");
  return data;
}
