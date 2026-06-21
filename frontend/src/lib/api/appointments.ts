import apiClient from "@/lib/api-client";
import type {
  AdminAppointmentFilters,
  AdminAppointmentList,
  Appointment,
  AppointmentStatus,
  CancelAppointmentResponse,
} from "@/types/api";

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

/**
 * Admin-only: list all appointments enriched with patient, doctor and service
 * details (GET /appointments/admin/). Supports status/service/date filters and
 * pagination; undefined filters are omitted.
 */
export async function getAllAppointments(
  filters: AdminAppointmentFilters = {},
): Promise<AdminAppointmentList> {
  const { data } = await apiClient.get<AdminAppointmentList>(
    "/appointments/admin/",
    { params: filters },
  );
  return data;
}

/**
 * Update an appointment's status for queue management (PATCH
 * /appointments/{id}/status). Restricted to admins and the owning doctor;
 * the backend rejects invalid status transitions.
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data } = await apiClient.patch<Appointment>(
    `/appointments/${id}/status`,
    { status },
  );
  return data;
}

/** Enriched appointment returned by GET /doctor/queue */
export interface QueueAppointment {
  appointment_id: string;
  patient_name: string | null;
  service_name: string | null;
  age: number | null;
  fee: number | null;
  payment_method: string | null;
  status: AppointmentStatus;
  start_time: string;
}

/** Fetch all of the authenticated doctor's appointments (any date). */
export async function getDoctorAppointments(): Promise<QueueAppointment[]> {
  const { data } = await apiClient.get<QueueAppointment[]>("/doctor/appointments");
  return data;
}