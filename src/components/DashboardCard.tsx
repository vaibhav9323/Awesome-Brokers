import React from 'react';
import { Home, Search } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: 'client' | 'customer';
  onClick: () => void;
}

export function DashboardCard({ title, description, icon, onClick }: DashboardCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transition-all hover:shadow-xl hover:scale-105 border border-gray-100"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
          {icon === 'client' ? (
            <Home className="w-10 h-10 text-blue-600" />
          ) : (
            <Search className="w-10 h-10 text-blue-600" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
        <div className="mt-4 inline-flex items-center text-blue-600 font-medium">
          Get Started
          <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}