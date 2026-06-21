'use client';

import React, { useState, useEffect } from 'react';
import { getDoctorStats, getDoctorQueue, QueueAppointment, DoctorStats } from '@/lib/api/doctor';
import DoctorDashboardSkeleton from '@/components/dashboard/DoctorDashboardSkeleton';
import StatsCard from '@/components/dashboard/StatsCard';
import AppointmentRow from '@/components/dashboard/AppointmentRow';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, queueData] = await Promise.all([
        getDoctorStats(),
        getDoctorQueue(),
      ]);
      setStats(statsData);
      setAppointments(queueData);
    } catch (error: any) {
      toast.error('Failed to load dashboard', {
        description: error.response?.data?.detail || 'Please refresh the page and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <DoctorDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Good day, Dr.</h1>
        <p className="text-indigo-100 text-lg">
          Your day, perfectly orchestrated. Confirm visits and review patients.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Earnings"
          value={`$${stats?.earnings_total || 0}`}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Appointments"
          value={stats?.appointments_count || 0}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Patients"
          value={stats?.patients_count || 0}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Today's schedule</h2>
          <p className="text-sm text-gray-500 mt-1">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        
        <div>
          {appointments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No appointments scheduled for today.</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.appointment_id}
                appointment={appointment}
                onStatusUpdate={fetchData}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}