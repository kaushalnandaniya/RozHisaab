'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import UndoToast from '@/components/UndoToast';
import HouseholdDashboard from '@/components/HouseholdDashboard';
import VendorDashboard from '@/components/VendorDashboard';
import RoleOnboardingModal from '@/components/RoleOnboardingModal';
import { speakHindi } from '@/lib/tts';
import { playSuccessChime, playWarningChime, playUndoChime } from '@/lib/chime';
import VoiceAlertBanner, { VoiceAlert } from '@/components/VoiceAlertBanner';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';

interface Entry {
  id: string;
  vendorId: string;
  quantity: number;
  unit: string;
  action: string;
  amountCalculated: number;
  metadata?: string;
  loggedBy?: string;
  createdAt: string;
  vendor: {
    displayName: string;
    icon?: string;
    color?: string;
    category: string;
  };
}

interface Vendor {
  id: string;
  displayName: string;
  category: string;
  unit: string;
  unitRate: number;
  icon?: string;
  jarDepositBalance?: number;
}

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
}

export default function HomePage() {
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [activeMember, setActiveMember] = useState('Kaushal');
  const [householdCode, setHouseholdCode] = useState('SHARMA-402');
  const [vendorBusinessName, setVendorBusinessName] = useState('Raju Doodh Dairy');
  const [vendorCategory, setVendorCategory] = useState('milk');
  const [vendorRouteName, setVendorRouteName] = useState('Gokuldham Heights - Tower A');
  const [merchantUpiPhone, setMerchantUpiPhone] = useState('9876543210');
  const [merchantRate, setMerchantRate] = useState(68);
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLoggedEntryId, setLastLoggedEntryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [totalToday, setTotalToday] = useState(0);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateLabel, setDateLabel] = useState<string>('Aaj');

  // Query Answer banner
  const [queryAnswer, setQueryAnswer] = useState<{ title: string; summary: string } | null>(null);

  // New Vendor celebration banner
  const [addedVendorNotice, setAddedVendorNotice] = useState<any | null>(null);

  // Vendor route batch confirmation banner
  const [vendorBatchNotice, setVendorBatchNotice] = useState<any[] | null>(null);

  // New Flat / Customer added celebration banner
  const [addedCustomerNotice, setAddedCustomerNotice] = useState<any | null>(null);

  // Active Voice Failure / Warning Alert
  const [voiceAlert, setVoiceAlert] = useState<VoiceAlert | null>(null);

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [manualVendorId, setManualVendorId] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualAction, setManualAction] = useState('received');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    // Immediate role restore from cache to prevent UI flash
    if (typeof window !== 'undefined') {
      const cachedRole = localStorage.getItem('rozhisaab_role') as 'household' | 'vendor' | null;
      if (cachedRole) setRole(cachedRole);
    }

    fetchProfile();
    fetchEntries(today);
    fetchVendors();
    fetchCustomers();

    // Check if initial role/category onboarding is needed
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('rozhisaab_onboarded');
      if (!onboarded) {
        setShowOnboardingModal(true);
      }
    }

    const handleRoleChange = (e: any) => {
      setRole(e.detail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rozhisaab_role', e.detail);
      }
    };
    const handleMemberChange = (e: any) => {
      setActiveMember(e.detail);
    };
    const handleOpenOnboarding = () => {
      setShowOnboardingModal(true);
    };

    window.addEventListener('rozhisaab-role-changed', handleRoleChange);
    window.addEventListener('rozhisaab-member-changed', handleMemberChange);
    window.addEventListener('rozhisaab-open-onboarding', handleOpenOnboarding);

    return () => {
      window.removeEventListener('rozhisaab-role-changed', handleRoleChange);
      window.removeEventListener('rozhisaab-member-changed', handleMemberChange);
      window.removeEventListener('rozhisaab-open-onboarding', handleOpenOnboarding);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setRole(data.user.role || 'household');
        if (typeof window !== 'undefined' && data.user.role) {
          localStorage.setItem('rozhisaab_role', data.user.role);
        }
        setActiveMember(data.user.activeMemberName || 'Kaushal');
        setHouseholdCode(data.user.householdCode || 'SHARMA-402');
        setVendorBusinessName(data.user.vendorBusinessName || 'Raju Doodh Dairy');
        setVendorCategory(data.user.vendorCategory || 'milk');
        setVendorRouteName(data.user.vendorRouteName || 'Gokuldham Heights - Tower A');
        if (data.user.merchantUpiPhone) setMerchantUpiPhone(data.user.merchantUpiPhone);
        if (data.user.merchantRate) setMerchantRate(data.user.merchantRate);
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
        if (data.vendors.length > 0) {
          setManualVendorId(data.vendors[0].id);
        }
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

  const fetchEntries = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/entries?date=${dateStr}`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
        const sum = data.entries.reduce((acc: number, curr: Entry) => acc + (curr.amountCalculated || 0), 0);
        setTotalToday(sum);
      }
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const setDateFilter = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
      setDateLabel('Kal');
    } else {
      setDateLabel('Aaj');
    }
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
    fetchEntries(iso);
  };

  const handleTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setQueryAnswer(null);
    setAddedVendorNotice(null);
    setVendorBatchNotice(null);
    setAddedCustomerNotice(null);
    setVoiceAlert(null);

    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          role 
        })
      });
      const parseData = await parseRes.json();

      // Check if error or could not update
      if (parseData.error || !parseData.success) {
        playWarningChime();
        if (parseData.spokenResponseHindi) {
          speakHindi(parseData.spokenResponseHindi);
        }
        setVoiceAlert({
          type: 'warning',
          title: 'Hisaab Update Nahi Hua (Balance/Quantity Not Updated)',
          reason: parseData.reason || 'Aapki aawaaz samajh nahi aayi ya customer match nahi hua.',
          rawTranscript: transcript,
          suggestion: parseData.suggestion || 'Kripya flat number ya customer ka naam saaf boliye.'
        });
        setIsProcessing(false);
        return;
      }

      // Case 0: CONVERSATIONAL VOICE UNDO (Vyapari & Household)
      if (parseData.intent === 'undo_last') {
        if (parseData.undo) {
          playUndoChime();
          setToastMessage(`↩️ ${parseData.message || 'Pichli entry safalta-purvak undo ho gayi!'}`);
          speakHindi(parseData.spokenResponseHindi);
          await fetchCustomers();
          await fetchEntries(selectedDate);
        } else {
          playWarningChime();
          setToastMessage(`⚠️ ${parseData.message || 'Undo karne ke liye koi haliya entry nahi mili.'}`);
          speakHindi(parseData.spokenResponseHindi);
        }
        setIsProcessing(false);
        return;
      }

      // Case 1: VENDOR DELIVERY ROUTE (Vyapari Mode)
      if (parseData.intent === 'vendor_delivery' && parseData.deliveries) {
        playSuccessChime();
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.8 } });
        speakHindi(parseData.spokenResponseHindi);
        setVendorBatchNotice(parseData.deliveries);
        await fetchCustomers();
        setIsProcessing(false);
        return;
      }

      // Case 1.5: ADD CUSTOMER TO ROUTE (Vyapari Mode)
      if (parseData.intent === 'add_customer') {
        playSuccessChime();
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.8 } });
        speakHindi(parseData.spokenResponseHindi);
        setAddedCustomerNotice(parseData.savedCustomer || parseData.newCustomer);
        await fetchCustomers();
        setIsProcessing(false);
        return;
      }

      // Case 2: ADD VENDOR INTENT
      if (parseData.intent === 'add_vendor') {
        playSuccessChime();
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
        speakHindi(parseData.spokenResponseHindi);
        setAddedVendorNotice(parseData.savedVendor || parseData.newVendor);
        await fetchVendors();
        setIsProcessing(false);
        return;
      }

      // Case 3: QUERY HISAAB INTENT
      if (parseData.intent === 'query_hisaab') {
        speakHindi(parseData.spokenResponseHindi);
        if (parseData.queryAnswer) {
          setQueryAnswer(parseData.queryAnswer);
        }
        setIsProcessing(false);
        return;
      }

      // Case 4: LOG ENTRY INTENT (Household Mode)
      if (!parseData.items || parseData.items.length === 0) {
        speakHindi('Aapki aawaaz samajh nahi aayi, kripya dohraiye');
        setIsProcessing(false);
        return;
      }

      let lastId: string | null = null;
      for (const item of parseData.items) {
        const createRes = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorCategory: item.vendorCategory,
            vendorName: item.vendorName,
            quantity: item.quantity,
            unit: item.unit,
            action: item.action,
            emptyReturned: item.emptyReturned,
            itemsDetail: item.itemsDetail,
            advanceAmount: item.advanceAmount,
            notes: item.notes,
            rawTranscript: transcript,
            entryDate: selectedDate,
            loggedBy: activeMember
          })
        });
        const createData = await createRes.json();
        if (createData.entry) {
          lastId = createData.entry.id;
        }
      }

      playSuccessChime();
      speakHindi(parseData.spokenResponseHindi);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });

      if (lastId) {
        setLastLoggedEntryId(lastId);
        setToastMessage(parseData.spokenResponseHindi);
      }

      await fetchEntries(selectedDate);
    } catch (err) {
      console.error('Error processing voice entry:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === manualVendorId);
    if (!vendor) return;

    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorCategory: vendor.category,
          vendorName: vendor.displayName,
          quantity: parseFloat(manualQty) || 1,
          unit: vendor.unit,
          action: manualAction,
          entryDate: selectedDate,
          loggedBy: activeMember,
          rawTranscript: 'Manual entry'
        })
      });

      playSuccessChime();
      setShowManualModal(false);
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
      setLastLoggedEntryId(null);
      setToastMessage(null);
      speakHindi('Entry wapas le li gayi');
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error('Failed to undo:', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
      speakHindi('Entry hata di gayi');
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen text-slate-900 pb-24 md:pb-12 transition-colors ${
      role === 'vendor' ? 'bg-slate-950/5' : 'bg-slate-50/70'
    }`}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Zero-Config Safety Banner */}
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {/* Active Voice Warning / Error Notification Banner */}
        <VoiceAlertBanner
          alert={voiceAlert}
          onDismiss={() => setVoiceAlert(null)}
          onRetry={() => {
            setVoiceAlert(null);
            speakHindi('Boliye, sun raha hoon');
          }}
          onManualOpen={() => setShowManualModal(true)}
        />

        {/* =========================================================================
            DYNAMIC WORKSPACE SWITCHING: HOUSEHOLD VS VENDOR
            ========================================================================= */}
        {role === 'household' ? (
          <HouseholdDashboard
            activeMember={activeMember}
            householdCode={householdCode}
            entries={entries}
            vendors={vendors}
            totalToday={totalToday}
            selectedDate={selectedDate}
            dateLabel={dateLabel}
            isProcessing={isProcessing}
            queryAnswer={queryAnswer}
            addedVendorNotice={addedVendorNotice}
            onTranscript={handleTranscript}
            onDateFilter={setDateFilter}
            onDeleteEntry={handleDeleteEntry}
            onOpenManualModal={() => setShowManualModal(true)}
            onOpenOnboarding={() => setShowOnboardingModal(true)}
          />
        ) : (
          <VendorDashboard
            businessName={vendorBusinessName}
            vendorCategory={vendorCategory}
            routeName={vendorRouteName}
            merchantUpiPhone={merchantUpiPhone}
            merchantRate={merchantRate}
            customers={customers}
            isProcessing={isProcessing}
            vendorBatchNotice={vendorBatchNotice}
            addedCustomerNotice={addedCustomerNotice}
            onTranscript={handleTranscript}
            onRefreshCustomers={fetchCustomers}
            onOpenOnboarding={() => setShowOnboardingModal(true)}
          />
        )}

      </div>

      {/* Manual Entry Modal (for Household) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Manual Entry Add Karein</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Vendor Chunein</label>
                <select
                  value={manualVendorId}
                  onChange={(e) => setManualVendorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.icon} {v.displayName} (₹{v.unitRate}/{v.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.25"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Action</label>
                  <select
                    value={manualAction}
                    onChange={(e) => setManualAction(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="received">Liya / Delivered</option>
                    <option value="absent">Chhutti / Absent</option>
                    <option value="given">Diya (Press)</option>
                    <option value="advance">Cash Advance</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                Hisaab Save Karein ({activeMember})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5-Second Undo Toast */}
      {lastLoggedEntryId && toastMessage && (
        <UndoToast
          message={toastMessage}
          entryId={lastLoggedEntryId}
          onUndo={handleUndo}
          durationSeconds={6}
        />
      )}

      {/* Initial Category & Role Onboarding Wizard */}
      <RoleOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        currentRole={role}
        currentMember={activeMember}
        currentHouseholdCode={householdCode}
        currentVendorBusiness={vendorBusinessName}
        currentVendorCategory={vendorCategory}
        currentVendorRoute={vendorRouteName}
        onComplete={(data) => {
          setRole(data.role);
          setActiveMember(data.activeMemberName);
          setHouseholdCode(data.householdCode);
          if (data.vendorBusinessName) setVendorBusinessName(data.vendorBusinessName);
          if (data.vendorCategory) setVendorCategory(data.vendorCategory);
          if (data.vendorRouteName) setVendorRouteName(data.vendorRouteName);
          fetchEntries(selectedDate);
          fetchCustomers();
        }}
      />
    </div>
  );
}
