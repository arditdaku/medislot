import apiClient from "@/lib/api-client";
import type { DoctorCreatePayload, Provider } from "@/types/api";

/** Fetch all active providers. */
export async function getProviders(): Promise<Provider[]> {
  const { data } = await apiClient.get<Provider[]>("/providers");
  return data;
}

/** Admin-only: create a doctor (User + Provider). */
export async function createDoctor(
  payload: DoctorCreatePayload
): Promise<Provider> {
  const { data } = await apiClient.post<Provider>("/providers", payload);
  return data;
}
