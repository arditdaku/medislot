import apiClient from "@/lib/api-client";
import type { AppointmentStatus } from "@/types/api";

export interface DashboardAppointment {
  id: string;
  doctor: string;
  specialty: string;
  start_time: string | null;
  status: AppointmentStatus;
  clinic: string | null;
}

export interface ActivityItem {
  type: string;
  title: string;
  message: string;
  created_at: string;
}

export interface PrescriptionItem {
  id: number;
  medication: string;
  dosage: string;
  prescribed_by: string | null;
  created_at: string;
}

export interface PatientDashboard {
  stats: {
    upcoming_appointments: number;
    completed_visits: number;
    active_prescriptions: number;
    new_notifications: number;
  };
  next_appointment: DashboardAppointment | null;
  upcoming: DashboardAppointment[];
  prescriptions: PrescriptionItem[];
  recent_activity: ActivityItem[];
  health_summary: {
    recent_visits: number;
    total_appointments: number;
    prescriptions: number;
  };
}

/** Aggregated data for the patient dashboard home screen. */
export async function getPatientDashboard(): Promise<PatientDashboard> {
  const { data } = await apiClient.get<PatientDashboard>("/dashboard/patient");
  return data;
}

/** Clear the patient's recent activity (deletes their notifications). */
export async function clearRecentActivity(): Promise<void> {
  await apiClient.delete("/dashboard/patient/activity");
}
