import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  bgColor = 'bg-blue-50',
  iconColor = 'text-blue-600'
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className={`h-12 w-12 ${bgColor} rounded-xl flex items-center justify-center mb-4`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
    </div>
  );
}