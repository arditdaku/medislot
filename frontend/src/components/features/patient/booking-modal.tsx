import { Calendar, Clock, Stethoscope, User } from "lucide-react";

type BookingModalProps = {
  service: {
    name: string;
    department: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
  date: string;
  time: string;
  duration: string;
  patient: {
    name: string;
    email: string;
  };
  onBackToEdit: () => void;
  onSuccess: () => void;
};

export default function BookingModal({
  service,
  doctor,
  date,
  time,
  duration,
  patient,
  onBackToEdit,
  onSuccess,
}: BookingModalProps) {
  const doctorInitials = doctor.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleConfirmBooking = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    const response = await fetch(`${apiUrl}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service,
        doctor,
        date,
        time,
        duration,
        patient,
        status: "pending",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to confirm booking");
    }

    onSuccess();
  };

  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Review booking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm the details before booking your appointment.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Service
            </p>
          </div>
          <p className="mt-2 font-semibold">{service.name}</p>
          <p className="text-sm text-muted-foreground">{service.department}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Doctor
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {doctorInitials}
            </div>
            <div>
              <p className="font-semibold">{doctor.name}</p>
              <p className="text-sm text-muted-foreground">
                {doctor.specialty}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Date
            </p>
          </div>
          <p className="mt-2 font-semibold">{date}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Time
            </p>
          </div>
          <p className="mt-2 font-semibold">{time}</p>
          <p className="text-sm text-muted-foreground">{duration}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Patient
            </p>
          </div>
          <p className="mt-2 font-semibold">{patient.name}</p>
          <p className="text-sm text-muted-foreground">{patient.email}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Status
          </p>
          <p className="mt-2 font-semibold">Will be confirmed</p>
          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Pending
          </span>
        </div>
      </div>

      <p className="mt-5 rounded-md bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
        Free cancellation up to 24 hours
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBackToEdit}
          className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Back to Edit
        </button>

        <button
          type="button"
          onClick={handleConfirmBooking}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Confirm Booking
        </button>
      </div>
    </section>
  );
}