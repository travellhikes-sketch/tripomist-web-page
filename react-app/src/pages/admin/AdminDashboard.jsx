import React from 'react';
import { Package, CalendarDays, Users, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back to the TripoMist admin panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Packages" 
          value="24" 
          icon={Package} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Active Packages" 
          value="18" 
          icon={Activity} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total Bookings" 
          value="156" 
          icon={CalendarDays} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Total Users" 
          value="1,204" 
          icon={Users} 
          color="bg-orange-500" 
        />
      </div>
      
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
          No recent activity to display.
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
