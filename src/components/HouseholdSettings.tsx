'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Home, 
  Share2, 
  Check, 
  Plus, 
  Save, 
  IndianRupee, 
  Phone, 
  Package, 
  Volume2, 
  Sparkles,
  UserCheck,
  ShieldCheck,
  X
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

interface Vendor {
  id: string;
  category: string;
  displayName: string;
  unit: string;
  unitRate: number;
  jarDepositBalance: number;
  vendorPhone?: string;
  icon?: string;
}

interface HouseholdSettingsProps {
  activeMember: string;
  householdCode: string;
  vendors: Vendor[];
  onRefreshVendors: () => void;
  onRefreshProfile: () => void;
}

export default function HouseholdSettings({
  activeMember,
  householdCode,
  vendors: initialVendors,
  onRefreshVendors,
  onRefreshProfile,
}: HouseholdSettingsProps) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [savedId, setSavedId] = useState<string | null>(null);

  React.useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [members, setMembers] = useState(['Kaushal', 'Mummy', 'Papa', 'Sister', 'Grandpa']);
  
  // Custom vendor modal
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorRate, setNewVendorRate] = useState('50');
  const [newVendorUnit, setNewVendorUnit] = useState('month');
  const [newVendorCategory, setNewVendorCategory] = useState('custom');
  const [newVendorPhone, setNewVendorPhone] = useState('');

  const copyCode = () => {
    navigator.clipboard.writeText(
      `Namaste! Join our RozHisaab Family Doorstep Ledger using Household Code: *${householdCode}*. Track daily milk, water & presswala together! https://github.com/kaushalnandaniya/RozHisaab`
    );
    playSuccessChime();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleUpdateVendor = async (v: Vendor) => {
    try {
      await fetch('/api/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: v.id,
          displayName: v.displayName,
          unitRate: v.unitRate,
          vendorPhone: v.vendorPhone,
          jarDepositBalance: v.jarDepositBalance
        })
      });

      playSuccessChime();
      setSavedId(v.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVendorFieldChange = (id: string, field: keyof Vendor, value: any) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const name = newMemberName.trim();
    if (!members.includes(name)) {
      setMembers(prev => [...prev, name]);
      playSuccessChime();
    }
    setNewMemberName('');
  };

  const handleSwitchActiveMember = async (name: string) => {
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeMemberName: name })
      });
      playSuccessChime();
      window.dispatchEvent(new CustomEvent('rozhisaab-member-changed', { detail: name }));
      onRefreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    try {
      await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newVendorName,
          category: newVendorCategory,
          unit: newVendorUnit,
          unitRate: parseFloat(newVendorRate) || 50,
          vendorPhone: newVendorPhone || undefined,
          icon: newVendorCategory === 'car_wash' ? '🚗' : newVendorCategory === 'cook' ? '👨‍🍳' : '🏷️'
        })
      });

      playSuccessChime();
      setNewVendorName('');
      setNewVendorPhone('');
      setShowAddVendor(false);
      onRefreshVendors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 shadow-md shadow-blue-500/15">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 bg-white/10 rounded-2xl backdrop-blur-xs">🏠</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Ghar Ki Settings & Vendors</h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">
              Manage family members, household sync code, and doorstep vendor rates.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Family & Shared Household Sync */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Family Members & Household Sync
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Shared Family Ledger</span>
        </div>

        {/* Sync Code Pill Box */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Household Invite Code:
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-mono font-black text-blue-950 tracking-wider">
                {householdCode}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                (Ghar ke sabhi phones par yeh code share karein)
              </span>
            </div>
          </div>

          <button
            onClick={copyCode}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied Invite!' : 'Share on WhatsApp'}</span>
          </button>
        </div>

        {/* Family Member Profiles */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Family Members (Active User Chunein):
          </label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button
                key={m}
                onClick={() => handleSwitchActiveMember(m)}
                className={`text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  activeMember === m
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{m}</span>
                {activeMember === m && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            ))}

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex items-center gap-1">
              <input
                type="text"
                placeholder="+ Add member..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-700"
                title="Add member"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION 2: Doorstep Vendors & Rates */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Doorstep Vendors & Rate Card
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Milk, water, presswala rates and empty jar balances
            </p>
          </div>

          <button
            onClick={() => setShowAddVendor(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-blue-200 flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Vendor</span>
          </button>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map(v => (
            <div
              key={v.id}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 bg-white rounded-xl shadow-2xs">
                    {v.icon || '🏷️'}
                  </span>
                  <div>
                    <input
                      type="text"
                      value={v.displayName}
                      onChange={(e) => handleVendorFieldChange(v.id, 'displayName', e.target.value)}
                      className="text-xs font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block capitalize">Category: {v.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleUpdateVendor(v)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
                    savedId === v.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                >
                  {savedId === v.id ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{savedId === v.id ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Rate (₹ per {v.unit})
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      step="0.5"
                      value={v.unitRate}
                      onChange={(e) => handleVendorFieldChange(v.id, 'unitRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold pl-7 pr-2 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Phone (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      value={v.vendorPhone || ''}
                      placeholder="9876543210"
                      onChange={(e) => handleVendorFieldChange(v.id, 'vendorPhone', e.target.value)}
                      className="w-full text-xs font-bold pl-7 pr-2 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Water Empty Jar Deposit Tracker */}
              {v.category === 'water' && (
                <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-950 font-bold">
                    <Package className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Ghar Pe Khali Water Jar:</span>
                  </div>
                  <input
                    type="number"
                    value={v.jarDepositBalance}
                    onChange={(e) => handleVendorFieldChange(v.id, 'jarDepositBalance', parseInt(e.target.value) || 0)}
                    className="w-16 text-center text-xs font-black bg-white border border-cyan-300 rounded-lg py-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900">Add New Doorstep Vendor</h3>
              <button onClick={() => setShowAddVendor(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomVendor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramu Car Wash, Balaji Cook"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="car_wash">Car Wash (गाड़ी सफाई)</option>
                  <option value="cook">Cook / Maharaj (खाना बनाने वाले)</option>
                  <option value="driver">Driver (ड्राइवर)</option>
                  <option value="gardener">Mali (माली)</option>
                  <option value="custom">Other Custom Service</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={newVendorRate}
                    onChange={(e) => setNewVendorRate(e.target.value)}
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={newVendorUnit}
                    onChange={(e) => setNewVendorUnit(e.target.value)}
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="month">Per Month (महीना)</option>
                    <option value="day">Per Day (दिन)</option>
                    <option value="visit">Per Visit (बार)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl shadow-md transition-all"
              >
                Save New Vendor
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
