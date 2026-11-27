'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import HouseholdSettings from '@/components/HouseholdSettings';
import VendorSettings from '@/components/VendorSettings';

export default function VendorsPage() {
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [activeMember, setActiveMember] = useState('Kaushal');
  const [householdCode, setHouseholdCode] = useState('SHARMA-402');
  const [vendorBusinessName, setVendorBusinessName] = useState('Raju Doodh Dairy');
  const [vendorCategory, setVendorCategory] = useState('milk');
  const [vendorRouteName, setVendorRouteName] = useState('Gokuldham Heights - Tower A');
  const [merchantUpiPhone, setMerchantUpiPhone] = useState('9876543210');
  const [merchantRate, setMerchantRate] = useState(68);

  const [vendors, setVendors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('rozhisaab_role') as 'household' | 'vendor' | null;
      if (cached) setRole(cached);
    }
    fetchProfile();
    fetchVendors();
    fetchCustomers();

    const handleRoleChange = (e: any) => {
      setRole(e.detail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rozhisaab_role', e.detail);
      }
    };

    window.addEventListener('rozhisaab-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('rozhisaab-role-changed', handleRoleChange);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setRole(data.user.role || 'household');
        setActiveMember(data.user.activeMemberName || 'Kaushal');
        setHouseholdCode(data.user.householdCode || 'SHARMA-402');
        setVendorBusinessName(data.user.vendorBusinessName || 'Raju Doodh Dairy');
        setVendorCategory(data.user.vendorCategory || 'milk');
        setVendorRouteName(data.user.vendorRouteName || 'Gokuldham Heights - Tower A');
        setMerchantUpiPhone(data.user.merchantUpiPhone || '9876543210');
        setMerchantRate(data.user.merchantRate || 68);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      if (data.vendors) {
        setVendors(data.vendors);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen pb-24 md:pb-12 transition-colors ${
      role === 'vendor' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {role === 'vendor' ? (
          <VendorSettings
            businessName={vendorBusinessName}
            vendorCategory={vendorCategory}
            routeName={vendorRouteName}
            merchantUpiPhone={merchantUpiPhone}
            merchantRate={merchantRate}
            customers={customers}
            onRefreshCustomers={fetchCustomers}
            onRefreshProfile={fetchProfile}
          />
        ) : (
          <HouseholdSettings
            activeMember={activeMember}
            householdCode={householdCode}
            vendors={vendors}
            onRefreshVendors={fetchVendors}
            onRefreshProfile={fetchProfile}
          />
        )}
      </div>
    </div>
  );
}
