'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  IndianRupee, 
  Send, 
  Check, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Droplet,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';
import confetti from 'canvas-confetti';

interface CustomerDelivery {
  id: string;
  customerId: string;
  deliveryDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  action: string; // received, absent, extra
  amount: number;
  notes?: string;
}

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
  deliveries?: CustomerDelivery[];
}

interface CustomerCalendarModalProps {
  customer: Customer;
  businessName: string;
  routeName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDelivery: (customerId: string, date: string, quantity: number, action: string) => Promise<void>;
}

export default function CustomerCalendarModal({
  customer,
  businessName,
  routeName,
  isOpen,
  onClose,
  onUpdateDelivery,
}: CustomerCalendarModalProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const today = new Date();
  const currentYear = 2026;
  const currentMonthIndex = 10; // November (0-based)
  const monthName = 'November';
  const totalDaysInMonth = 30; // November has 30 days
  const todayDayNumber = 27; // Nov 27

  // Map deliveries by day number
  const deliveryMap: { [day: number]: CustomerDelivery } = {};
  if (customer.deliveries) {
    customer.deliveries.forEach((d) => {
      const parts = d.deliveryDate.split('-');
      if (parts.length === 3) {
        const dayNum = parseInt(parts[2], 10);
        deliveryMap[dayNum] = d;
      }
    });
  }

  // Calculate monthly stats
  let totalLitres = 0;
  let totalDaysPresent = 0;
  let totalDaysAbsent = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const entry = deliveryMap[d];
    if (entry) {
      if (entry.action === 'absent') {
        totalDaysAbsent += 1;
      } else {
        totalLitres += entry.quantity;
        totalDaysPresent += 1;
      }
    } else if (d < todayDayNumber) {
      // Past day default regular quantity
      totalLitres += customer.dailyQuantity;
      totalDaysPresent += 1;
    }
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const handleQuickSet = async (day: number, qty: number, action: string) => {
    setIsUpdating(true);
    try {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${currentYear}-11-${dayStr}`;
      await onUpdateDelivery(customer.id, dateStr, qty, action);
      playSuccessChime();
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
      setSelectedDay(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const generateMonthlyWhatsAppCard = () => {
    let lines: string[] = [];
    lines.push(`🙏 *Namaste ${customer.customerName}*,`);
    lines.push(`*${businessName} - ${monthName} ${currentYear} Milk Delivery Card* 📋`);
    lines.push(`${customer.flatNumber} • ${routeName}`);
    lines.push(`-----------------------------------`);
    lines.push(`📅 *Date-wise Daily Deliveries:*`);

    for (let d = 1; d <= todayDayNumber; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const entry = deliveryMap[d];
      if (entry) {
        if (entry.action === 'absent') {
          lines.push(`${dayStr} Nov: 🏖️ Chhutti / Absent`);
        } else if (entry.action === 'extra' || entry.quantity > customer.dailyQuantity) {
          lines.push(`${dayStr} Nov: 🥛 *${entry.quantity}L (Extra)*`);
        } else {
          lines.push(`${dayStr} Nov: 🥛 ${entry.quantity}L`);
        }
      } else {
        lines.push(`${dayStr} Nov: 🥛 ${customer.dailyQuantity}L`);
      }
    }

    lines.push(`-----------------------------------`);
    lines.push(`🥛 *Total Milk Delivered:* ${totalLitres.toFixed(1)} Litres`);
    lines.push(`💰 *Total Balance Payable:* ₹${customer.pendingBalance.toFixed(0)}`);
    lines.push(`\n📲 *Pay via UPI:* upi://pay?pa=9876543210@upi&pn=${encodeURIComponent(businessName)}&am=${customer.pendingBalance.toFixed(0)}`);
    lines.push(`\n_Hisaab generated hands-free via RozHisaab_`);

    const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                🥛
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-lg font-mono">
                    {customer.flatNumber}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white">{customer.customerName}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  दूध का पर्चा (Daily Milk Delivery Calendar) • {monthName} {currentYear}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Monthly KPI Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold block">Regular Daily</span>
              <span className="text-sm font-black text-white">{customer.dailyQuantity} L/day</span>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold block">Total Delivered</span>
              <span className="text-sm font-black text-emerald-400">{totalLitres.toFixed(1)} Litres</span>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold block">Leaves (Chhutti)</span>
              <span className="text-sm font-black text-amber-400">{totalDaysAbsent} Days</span>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold block">Pending Balance</span>
              <span className="text-sm font-black text-emerald-400 flex items-center">
                <IndianRupee className="w-3.5 h-3.5" />
                {customer.pendingBalance.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Monthly Calendar Grid */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span>{monthName} 2026 — Tarikh-Wise Quantity Grid</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click on any date to adjust quantity</span>
          </div>

          {/* Days Grid (7 columns: Mon to Sun) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
              <div key={idx} className="text-center text-[10px] font-black text-slate-400 uppercase py-1">
                {dayName}
              </div>
            ))}

            {/* Empty offset for November 2026 (Nov 1 is Sunday, so 6 empty slots if Mon start) */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 rounded-xl bg-slate-50/30 border border-transparent opacity-30" />
            ))}

            {/* 30 Days of November */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const day = i + 1;
              const delivery = deliveryMap[day];
              const isToday = day === todayDayNumber;
              const isFuture = day > todayDayNumber;
              const isSelected = selectedDay === day;

              let qtyDisplay = `${customer.dailyQuantity}L`;
              let isAbsent = false;
              let isExtra = false;

              if (delivery) {
                if (delivery.action === 'absent') {
                  isAbsent = true;
                  qtyDisplay = 'Chhutti';
                } else if (delivery.action === 'extra' || delivery.quantity > customer.dailyQuantity) {
                  isExtra = true;
                  qtyDisplay = `${delivery.quantity}L ⭐`;
                } else {
                  qtyDisplay = `${delivery.quantity}L`;
                }
              } else if (isFuture) {
                qtyDisplay = '—';
              }

              return (
                <div key={day} className="relative">
                  <button
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`w-full p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[60px] sm:min-h-[68px] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500 shadow-md'
                        : isToday
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/40 shadow-xs'
                        : isAbsent
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : isExtra
                        ? 'border-emerald-300 bg-emerald-100/70 text-emerald-950 font-black'
                        : isFuture
                        ? 'border-slate-100 bg-slate-50/50 text-slate-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className={`text-[10px] font-mono font-bold ${
                        isToday ? 'text-emerald-700 font-black' : 'text-slate-400'
                      }`}>
                        {day}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Aaj" />
                      )}
                    </div>

                    <span className={`text-[11px] font-extrabold block my-auto ${
                      isAbsent
                        ? 'text-amber-700'
                        : isExtra
                        ? 'text-emerald-800 font-black'
                        : isFuture
                        ? 'text-slate-300'
                        : 'text-slate-900'
                    }`}>
                      {qtyDisplay}
                    </span>
                  </button>

                  {/* Inline Day Edit Popover */}
                  {isSelected && (
                    <div className="absolute z-20 left-1/2 -translate-x-1/2 -top-14 bg-slate-900 text-white rounded-xl p-1.5 shadow-2xl flex items-center gap-1 border border-slate-700 animate-fade-in whitespace-nowrap">
                      <button
                        onClick={() => handleQuickSet(day, customer.dailyQuantity, 'received')}
                        className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded-lg"
                      >
                        {customer.dailyQuantity}L
                      </button>
                      <button
                        onClick={() => handleQuickSet(day, customer.dailyQuantity + 1.0, 'extra')}
                        className="px-2 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                        title="Add 1L extra"
                      >
                        +1L Extra
                      </button>
                      <button
                        onClick={() => handleQuickSet(day, customer.dailyQuantity + 2.0, 'extra')}
                        className="px-2 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                        title="Add 2L extra"
                      >
                        +2L Extra
                      </button>
                      <button
                        onClick={() => handleQuickSet(day, 0, 'absent')}
                        className="px-2 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-500 rounded-lg"
                      >
                        Chhutti
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              💡 Rate: ₹68 / Litre • Har date par auto-calculated
            </span>

            <a
              href={generateMonthlyWhatsAppCard()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Par 30-Day Milk Card Bhejein</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
