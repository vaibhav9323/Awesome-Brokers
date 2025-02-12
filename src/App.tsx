import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { DashboardCard } from './components/DashboardCard';
import { ClientAuth } from './pages/ClientAuth';
import { CustomerAuth } from './pages/CustomerAuth';
import { ClientProfile } from './pages/ClientProfile';
import { PropertyListing } from './pages/PropertyListing';
import { AddProperty } from './pages/AddProperty';
import { ProfileEdit } from './pages/ProfileEdit';
import type { UserRole } from './types';

function LandingPage() {
  const handleRoleSelect = (role: UserRole) => {
    if (role === 'client') {
      window.location.href = '/client/auth';
    } else {
      window.location.href = '/customer/auth';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to PropertyFinder
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your one-stop solution for property management and discovery. Join thousands of satisfied users
            who trust PropertyFinder for their real estate needs.
          </p>
          <div className="flex justify-center space-x-4">
            <div className="px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium">
              10,000+ Properties Listed
            </div>
            <div className="px-4 py-2 bg-green-100 rounded-full text-green-800 text-sm font-medium">
              5,000+ Happy Customers
            </div>
            <div className="px-4 py-2 bg-purple-100 rounded-full text-purple-800 text-sm font-medium">
              24/7 Support
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <DashboardCard
            title="I'm a Property Owner"
            description="List your properties and manage your listings with our powerful tools"
            icon="client"
            onClick={() => handleRoleSelect('client')}
          />
          <DashboardCard
            title="I'm Looking for Property"
            description="Find your perfect property with our advanced search features"
            icon="customer"
            onClick={() => handleRoleSelect('customer')}
          />
        </div>

        <div className="mt-16 space-y-16">
          <div className="rounded-xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
            <img
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80"
              alt="Modern home exterior"
              className="w-full h-[400px] object-cover"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Easy Listing</h3>
              <p className="text-gray-600">List your properties in minutes with our streamlined process</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-gray-600">Find exactly what you're looking for with advanced filters</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/client/auth" element={<ClientAuth />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/profile/edit" element={<ProfileEdit />} />
        <Route path="/client/property/add" element={<AddProperty />} />
        <Route path="/customer/auth" element={<CustomerAuth />} />
        <Route path="/properties" element={<PropertyListing />} />
      </Routes>
    </Router>
  );
}

export default App;