// Shared API response types — mirror the FastAPI backend response schemas.

/** Backend `SlotStatus` enum (app/models/slot.py). */
export type SlotStatus = "available" | "booked" | "blocked";

/** Backend `AppointmentStatus` enum (app/models/appointment.py). */
export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | "waiting"
  | "in_progress";

/** GET /providers — `ProviderResponse`. */
export interface Provider {
  id: number;
  user_id: number;
  /** Doctor's display name (sourced from the linked user). */
  full_name: string;
  specialty: string;
  working_hours: Record<string, unknown> | null;
  experience: string | null;
  fees: number | null;
  address: string | null;
  about: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** POST /providers — `DoctorCreate` (admin creates a doctor). */
export interface DoctorCreatePayload {
  full_name: string;
  email: string;
  password: string;
  specialty: string;
  working_hours?: Record<string, unknown> | null;
  experience?: string | null;
  fees?: number | null;
  address?: string | null;
  about?: string | null;
}

/** PUT /providers/{id} — `ProviderUpdate` (all fields optional). */
export interface ProviderUpdatePayload {
  specialty?: string | null;
  fees?: number | null;
  address?: string | null;
  about?: string | null;
  working_hours?: Record<string, unknown> | null;
}

/** GET /services — `ServiceResponse`. */
export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  department: string;
  created_at: string;
}

/** GET /slots — `SlotResponse`. `id` is a UUID. */
export interface Slot {
  id: string;
  provider_id: number;
  start_time: string;
  end_time: string;
  status: SlotStatus;
}

/** `AppointmentResponse` — all id/uuid fields are strings. */
export interface Appointment {
  id: string;
  patient_id: string;
  slot_id: string;
  service_id: number;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

/** GET /appointments/admin/ — one row of `AdminAppointmentResponse`. */
export interface AdminAppointment {
  id: string;
  patient_name: string | null;
  patient_age: number | null;
  doctor_name: string | null;
  service_name: string | null;
  fee: number | null;
  appointment_datetime: string;
  status: AppointmentStatus;
}

/** GET /appointments/admin/ — paginated `AdminAppointmentListResponse`. */
export interface AdminAppointmentList {
  total: number;
  limit: number;
  offset: number;
  items: AdminAppointment[];
}

/** Query filters for GET /appointments/admin/. */
export interface AdminAppointmentFilters {
  status?: AppointmentStatus;
  service_id?: number;
  /** ISO datetime string. */
  date?: string;
  limit?: number;
  offset?: number;
}

/** DELETE /appointments/{id} response body. */
export interface CancelAppointmentResponse {
  message: string;
  appointment_id: string;
}
