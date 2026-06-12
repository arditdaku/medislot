import apiClient from "@/lib/api-client";
import type { Provider } from "@/types/api";

/** Fetch all active providers. */
export async function getProviders(): Promise<Provider[]> {
  const { data } = await apiClient.get<Provider[]>("/providers");
  return data;
}
