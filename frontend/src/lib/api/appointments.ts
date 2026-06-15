import apiClient from "@/lib/api-client";
import type { Appointment, CancelAppointmentResponse } from "@/types/api";

/** Book an available slot for a service. The patient is resolved from the JWT. */
export async function bookAppointment(
  slotId: string,
  serviceId: number,
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>("/appointments", {
    slot_id: slotId,
    service_id: serviceId,
  });
  return data;
}

/** Cancel an appointment by id. Frees the underlying slot server-side. */
export async function cancelAppointment(
  id: string,
): Promise<CancelAppointmentResponse> {
  const { data } = await apiClient.delete<CancelAppointmentResponse>(
    `/appointments/${id}`,
  );
  return data;
}

/** Move an appointment to a different available slot. */
export async function rescheduleAppointment(
  id: string,
  slotId: string,
): Promise<Appointment> {
  const { data } = await apiClient.patch<Appointment>(
    `/appointments/${id}/reschedule`,
    { slot_id: slotId },
  );
  return data;
}

/** Fetch the authenticated patient's own appointments. */
export async function getMyAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<Appointment[]>("/appointments/me");
  return data;
}
