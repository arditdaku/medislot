'use client';

import { updateAppointmentStatus, QueueAppointment } from '@/lib/api/doctor';
import { toast } from 'sonner';
import type { AppointmentStatus } from '@/types/api';

interface AppointmentRowProps {
  appointment: QueueAppointment;
  onStatusUpdate: () => void;
}

// Status pill shown on every row so the doctor always sees where the
// appointment stands (waiting → in progress → completed).
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  waiting: { label: 'Waiting', cls: 'bg-amber-50 text-amber-600' },
  in_progress: { label: 'In progress', cls: 'bg-indigo-50 text-indigo-600' },
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600' },
  no_show: { label: 'No show', cls: 'bg-gray-100 text-gray-500' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-600' },
};

function errorDetail(error: unknown): string {
  return (
    (error as { response?: { data?: { detail?: string } } })?.response?.data
      ?.detail ?? 'Please try again later.'
  );
}

export default function AppointmentRow({ appointment, onStatusUpdate }: AppointmentRowProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateTime = (dateTime: string) => {
    const d = new Date(dateTime);
    return {
      date: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  // Actions follow the backend's valid transitions: waiting → in_progress →
  // completed (the check advances one step), and either can be cancelled.
  // Terminal statuses (completed/cancelled/no_show) show a pill instead.
  const isActionable =
    appointment.status === 'waiting' || appointment.status === 'in_progress';

  const advanceLabel =
    appointment.status === 'waiting' ? 'Start visit' : 'Complete visit';

  const update = async (status: AppointmentStatus, success: string) => {
    try {
      await updateAppointmentStatus(appointment.appointment_id, status);
      toast.success(success, {
        description: `${appointment.patient_name}'s appointment was updated.`,
      });
      onStatusUpdate();
    } catch (error) {
      toast.error('Failed to update appointment', {
        description: errorDetail(error),
      });
    }
  };

  const handleAdvance = () =>
    update(
      appointment.status === 'waiting' ? 'in_progress' : 'completed',
      appointment.status === 'waiting' ? 'Visit started' : 'Appointment completed',
    );

  const handleCancel = () => update('cancelled', 'Appointment cancelled');

  const { date, time } = formatDateTime(appointment.start_time);
  const statusMeta = STATUS_LABEL[appointment.status];

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Patient Avatar with Gradient */}
        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {getInitials(appointment.patient_name || 'NA')}
          </span>
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">
            {appointment.patient_name}
          </h4>
          <p className="text-sm text-gray-500">
            {date} · {time}
          </p>
        </div>
      </div>

      {/* Status pill (always) + actions while the appointment is still open */}
      <div className="flex items-center gap-3 ml-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            statusMeta?.cls ?? 'bg-gray-100 text-gray-500'
          }`}
        >
          {statusMeta?.label ?? appointment.status}
        </span>

        {isActionable && (
          <div className="flex gap-2">
            <button
              onClick={handleAdvance}
              className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors"
              title={advanceLabel}
            >
              <svg className="h-5 w-5 text-gray-600 hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-colors"
              title="Cancel appointment"
            >
              <svg className="h-5 w-5 text-gray-600 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
