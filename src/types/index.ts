export type VendorCategory = 
  | 'milk'
  | 'water'
  | 'laundry'
  | 'maid'
  | 'tiffin'
  | 'newspaper'
  | 'car_wash'
  | 'custom';

export type EntryAction = 
  | 'received'
  | 'given'
  | 'absent'
  | 'advance'
  | 'returned'
  | 'skipped';

export interface Vendor {
  id: string;
  userId: string;
  name: VendorCategory | string;
  displayName: string;
  unit: string;
  unitRate: number;
  jarDepositBalance: number; // specialized for water cans (empty vs filled)
  vendorPhone?: string;
  icon?: string;
  color?: string;
}

export interface Entry {
  id: string;
  userId: string;
  vendorId: string;
  vendorName: string;
  entryDate: string; // ISO date string YYYY-MM-DD
  quantity: number;
  unit: string;
  action: EntryAction;
  metadata?: {
    emptyReturned?: number;
    items?: Record<string, number>; // e.g. { shirt: 4, pant: 2 }
    notes?: string;
  };
  amountCalculated: number;
  rawTranscript?: string;
  createdAt: string;
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

export interface ParseResult {
  success: boolean;
  transcript: string;
  items: ParsedItem[];
  method: 'wispr' | 'gemini' | 'groq' | 'rule_based';
  spokenResponseHindi: string;
  spokenResponseEnglish: string;
  unrecognizedParts?: string[];
  keyMissingNotice?: string;
}

export interface SettlementSummary {
  vendorId: string;
  vendorName: string;
  displayName: string;
  unit: string;
  unitRate: number;
  month: string; // e.g. "November 2026"
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
