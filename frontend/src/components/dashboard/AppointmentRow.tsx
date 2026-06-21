'use client';

import React from 'react';
import { updateAppointmentStatus, QueueAppointment } from '@/lib/api/doctor';
import { toast } from 'sonner';

interface AppointmentRowProps {
  appointment: QueueAppointment;
  onStatusUpdate: () => void;
}

export default function AppointmentRow({ appointment, onStatusUpdate }: AppointmentRowProps) {
  // Extract initials from patient name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date and time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const handleConfirm = async () => {
    try {
      await updateAppointmentStatus(appointment.appointment_id, 'confirmed');
      toast.success('Appointment confirmed', {
        description: `${appointment.patient_name}'s appointment has been confirmed.`,
      });
      onStatusUpdate();
    } catch (error: any) {
      toast.error('Failed to confirm appointment', {
        description: error.response?.data?.detail || 'Please try again later.',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await updateAppointmentStatus(appointment.appointment_id, 'cancelled');
      toast.success('Appointment cancelled', {
        description: `${appointment.patient_name}'s appointment has been cancelled.`,
      });
      onStatusUpdate();
    } catch (error: any) {
      toast.error('Failed to cancel appointment', {
        description: error.response?.data?.detail || 'Please try again later.',
      });
    }
  };

  const { date, time } = formatDateTime(appointment.start_time);

  // Determine if buttons should be disabled
  const isDisabled = appointment.status === 'confirmed' || appointment.status === 'cancelled';

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

      {/* Action Buttons */}
      <div className="flex gap-2 ml-4">
        <button
          onClick={handleConfirm}
          disabled={isDisabled}
          className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Confirm appointment"
        >
          <svg className="h-5 w-5 text-gray-600 hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          onClick={handleCancel}
          disabled={isDisabled}
          className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Cancel appointment"
        >
          <svg className="h-5 w-5 text-gray-600 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}