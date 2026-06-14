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
}: BookingModalProps) {
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
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Service
          </p>
          <p className="mt-2 font-semibold">{service.name}</p>
          <p className="text-sm text-muted-foreground">{service.department}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Doctor
          </p>
          <p className="mt-2 font-semibold">{doctor.name}</p>
          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Date
          </p>
          <p className="mt-2 font-semibold">{date}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Time
          </p>
          <p className="mt-2 font-semibold">{time}</p>
          <p className="text-sm text-muted-foreground">{duration}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Patient
          </p>
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
    </section>
  );
}