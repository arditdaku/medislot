import apiClient from "@/lib/api-client";
import type {
  Service,
  ServiceCreatePayload,
  ServiceUpdatePayload,
} from "@/types/api";

/** Fetch all bookable services. */
export async function getServices(): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>("/services");
  return data;
}

/** Admin-only: create a new service (POST /services). */
export async function createService(
  payload: ServiceCreatePayload,
): Promise<Service> {
  const { data } = await apiClient.post<Service>("/services", payload);
  return data;
}

/** Admin-only: update an existing service (PUT /services/{id}). */
export async function updateService(
  id: number,
  payload: ServiceUpdatePayload,
): Promise<Service> {
  const { data } = await apiClient.put<Service>(`/services/${id}`, payload);
  return data;
}

/** Admin-only: delete a service (DELETE /services/{id}). */
export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}
