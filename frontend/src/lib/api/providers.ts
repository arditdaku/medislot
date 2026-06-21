import apiClient from "@/lib/api-client";
import type {
  DoctorCreatePayload,
  Provider,
  ProviderUpdatePayload,
} from "@/types/api";

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

/**
 * Update a provider's editable fields. Allowed for admins and for the owning
 * doctor (PUT /providers/{id}).
 */
export async function updateProvider(
  id: number,
  payload: ProviderUpdatePayload
): Promise<Provider> {
  const { data } = await apiClient.put<Provider>(`/providers/${id}`, payload);
  return data;
}

/**
 * Admin-only: permanently delete a doctor (DELETE /providers/{id}). Rejected
 * with 409 if the doctor has any appointments on record.
 */
export async function deleteProvider(id: number): Promise<void> {
  await apiClient.delete(`/providers/${id}`);
}

/** Fetch the authenticated doctor's own provider profile. */
export async function getMyProvider(): Promise<Provider> {
  const { data } = await apiClient.get<Provider>("/providers/me");
  return data;
}

/** Update the authenticated doctor's own provider profile. */
export async function updateMyProvider(id: number, payload: ProviderUpdatePayload): Promise<Provider> {
  const { data } = await apiClient.put<Provider>(`/providers/${id}`, payload);
  return data;
}
