import apiClient from "@/lib/api-client";
import type { Slot, AppointmentStatus } from "@/types/api";

/** GET /doctor/schedule?date=YYYY-MM-DD — logged-in doctor's slots for a given date. */
export async function getDoctorSchedule(date: string): Promise<Slot[]> {
  const { data } = await apiClient.get<Slot[]>("/doctor/schedule", {
    params: { date },
  });
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

/** GET /doctor/queue — logged-in doctor's appointments for today. Optional status filter. */
export async function getDoctorQueue(status?: AppointmentStatus): Promise<QueueAppointment[]> {
  const { data } = await apiClient.get<QueueAppointment[]>("/doctor/queue", {
    params: status ? { status } : undefined,
  });
  return data;
}

/** Stats returned by GET /doctor/stats */
export interface DoctorStats {
  earnings_total: number;
  appointments_count: number;
  patients_count: number;
}

/** GET /doctor/stats — logged-in doctor's aggregated stats. */
export async function getDoctorStats(): Promise<DoctorStats> {
  const { data } = await apiClient.get<DoctorStats>("/doctor/stats");
  return data;
}

/** PATCH /appointments/{id}/status — update appointment status (confirm/cancel/complete). */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<any> {
  const { data } = await apiClient.patch(`/appointments/${appointmentId}/status`, {
    status,
  });
  return data;
}