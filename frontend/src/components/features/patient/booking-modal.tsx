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
    <div>
      <h2>Review booking</h2>
    </div>
  );
}