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
): Promise<unknown> {
  const { data } = await apiClient.patch(`/appointments/${appointmentId}/status`, {
    status,
  });
  return data;
}


// Visit Records API
export interface VisitRecordCreate {
  appointment_id: string;
  notes: string;
}

export interface VisitRecordResponse {
  id: string;
  appointment_id: string;
  doctor_id: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export async function createVisitRecord(
  payload: VisitRecordCreate,
): Promise<VisitRecordResponse> {
  const { data } = await apiClient.post<VisitRecordResponse>(
    "/visit-records",
    payload,
  );
  return data;
}

export async function getVisitRecord(
  appointmentId: string,
): Promise<VisitRecordResponse> {
  const { data } = await apiClient.get<VisitRecordResponse>(
    `/visit-records/${appointmentId}`,
  );
  return data;
}

/** Enriched visit record returned by GET /doctor/visits */
export interface DoctorVisit {
  id: string;
  appointment_id: string;
  patient_name: string | null;
  service_name: string | null;
  appointment_date: string;
  notes: string;
  ai_summary: string | null;
  created_at: string;
}

/** GET /doctor/visits — logged-in doctor's visit history, newest first. */
export async function getDoctorVisits(search?: string): Promise<DoctorVisit[]> {
  const { data } = await apiClient.get<DoctorVisit[]>("/doctor/visits", {
    params: search ? { search } : undefined,
  });
  return data;
}

// Prescriptions API
export interface PrescriptionCreate {
  appointment_id: string;
  medication: string;
  dosage: string;
  duration_days: number;
}

export interface PrescriptionResponse {
  id: number;
  patient_id: string;
  medication: string;
  dosage: string;
  duration_days: number;
  prescribed_by: string | null;
  is_active: boolean;
  created_at: string;
}

/** Doctor-only: prescribe medication for an appointment's patient. */
export async function createPrescription(
  payload: PrescriptionCreate,
): Promise<PrescriptionResponse> {
  const { data } = await apiClient.post<PrescriptionResponse>(
    "/prescriptions",
    payload,
  );
  return data;
}

/** Prescriptions the current doctor gave the appointment's patient (newest first). */
export async function getAppointmentPrescriptions(
  appointmentId: string,
): Promise<PrescriptionResponse[]> {
  const { data } = await apiClient.get<PrescriptionResponse[]>(
    `/prescriptions/appointment/${appointmentId}`,
  );
  return data;
}

// Provider Profile API
export interface ProviderProfile {
  id: number;
  user_id: number;
  specialty: string;
  working_hours: Record<string, unknown> | null;
  experience: string | null;
  fees: number | null;
  address: string | null;
  about: string | null;
  is_active: boolean;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderUpdatePayload {
  about?: string | null;
  fees?: number | null;
  address?: string | null;
  working_hours?: Record<string, unknown> | null;
  is_active?: boolean;
}

export async function getMyProvider(): Promise<ProviderProfile> {
  const { data } = await apiClient.get<ProviderProfile>("/doctor/profile");
  return data;
}

export async function updateMyProvider(
  payload: ProviderUpdatePayload,
): Promise<ProviderProfile> {
  const { data } = await apiClient.patch<ProviderProfile>(
    "/doctor/profile",
    payload,
  );
  return data;
}