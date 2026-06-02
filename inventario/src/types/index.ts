export type Role = 'admin' | 'editor' | 'viewer';

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: Role;
  can_access_inventory: boolean;
  can_access_loans: boolean;
  can_access_reports: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  loaned: number;
  lowStockThreshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  productId: string;
  loanedTo: string;
  deliveredBy: string;
  quantity: number;
  loanDate: string;
  returnDate: string | null;
  returnImageData: string | null; // Base64 image
  status: 'active' | 'returned';
}

export interface Activity {
  id: string;
  type: 'loan_created' | 'loan_returned' | 'product_added' | 'product_updated' | 'stock_adjusted';
  details: string;
  timestamp: string;
  userId?: string;
}
