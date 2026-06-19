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
 * Admin-only: toggle a provider's active flag (PATCH
 * /providers/{id}/deactivate). Returns the updated provider.
 */
export async function deactivateProvider(id: number): Promise<Provider> {
  const { data } = await apiClient.patch<Provider>(
    `/providers/${id}/deactivate`
  );
  return data;
}
