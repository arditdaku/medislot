export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  // Patient
  PATIENT_DASHBOARD: "/patient",
  PATIENT_BOOK: "/patient/book",
  PATIENT_APPOINTMENTS: "/patient/appointments",
  PATIENT_PROFILE: "/patient/profile",

  // Doctor
  DOCTOR_DASHBOARD: "/doctor",
  DOCTOR_SCHEDULE: "/doctor/schedule",
  DOCTOR_VISITS: "/doctor/visits",

  // Admin
  STAFF_DASHBOARD: "/staff",
  STAFF_PROVIDERS: "/staff/providers",
  STAFF_SERVICES: "/staff/services",
  STAFF_SLOTS: "/staff/slots",
  STAFF_APPOINTMENTS: "/staff/appointments",
  STAFF_QUEUE: "/staff/queue",
} as const;

export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER];

export const PROTECTED_PREFIXES = ["/patient", "/doctor", "/staff"];