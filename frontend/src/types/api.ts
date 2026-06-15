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
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

/** DELETE /appointments/{id} response body. */
export interface CancelAppointmentResponse {
  message: string;
  appointment_id: string;
}
