export type VendorCategory = 
  | 'milk'
  | 'water'
  | 'laundry'
  | 'maid'
  | 'tiffin'
  | 'newspaper'
  | 'car_wash'
  | 'cook'
  | 'driver'
  | 'gardener'
  | 'custom';

export type EntryAction = 
  | 'received'
  | 'given'
  | 'absent'
  | 'advance'
  | 'returned'
  | 'skipped';

export type UserIntent = 
  | 'log_entry'      // "Aaj doodh dedh litre liya..."
  | 'add_vendor'     // "Naya vendor add karo: Ramu Car wash, rate 500..."
  | 'query_hisaab';  // "Is mahine paani ka kitna hisaab hua?"

export interface Vendor {
  id: string;
  userId: string;
  category: VendorCategory | string;
  displayName: string;
  unit: string;
  unitRate: number;
  jarDepositBalance: number;
  vendorPhone?: string;
  icon?: string;
  color?: string;
}

export interface Entry {
  id: string;
  userId: string;
  vendorId: string;
  entryDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  action: EntryAction;
  metadata?: string;
  amountCalculated: number;
  rawTranscript?: string;
  createdAt: string;
  vendor: {
    displayName: string;
    icon?: string;
    color?: string;
    category: string;
  };
}

export interface ParsedItem {
  vendorCategory: VendorCategory;
  vendorName: string;
  quantity: number;
  unit: string;
  action: EntryAction;
  emptyReturned?: number;
  itemsDetail?: Record<string, number>;
  advanceAmount?: number;
  notes?: string;
  confidence: number;
}

export interface NewVendorPayload {
  displayName: string;
  category: VendorCategory | string;
  unit: string;
  unitRate: number;
  vendorPhone?: string;
  icon: string;
  color: string;
}

export interface QueryPayload {
  targetCategory?: string;
  queryType: 'total_spend' | 'pending_items' | 'vendor_summary';
  timeframe: 'current_month' | 'today' | 'all_time';
}

export interface ParseResult {
  success: boolean;
  intent: UserIntent;
  transcript: string;
  items: ParsedItem[];
  newVendor?: NewVendorPayload;
  query?: QueryPayload;
  method: 'wispr' | 'gemini' | 'groq' | 'rule_based';
  spokenResponseHindi: string;
  spokenResponseEnglish: string;
  queryAnswer?: {
    title: string;
    summary: string;
    amount?: number;
    details?: string;
  };
  keyMissingNotice?: string;
}

export interface SettlementSummary {
  vendorId: string;
  vendorName: string;
  displayName: string;
  unit: string;
  unitRate: number;
  month: string;
  totalQuantity: number;
  totalDaysPresent?: number;
  totalDaysAbsent?: number;
  totalEmptyReturned?: number;
  pendingJarBalance?: number;
  advanceDeducted?: number;
  totalAmountPayable: number;
  whatsappMessage: string;
  upiPaymentLink?: string;
  entries: Entry[];
}
