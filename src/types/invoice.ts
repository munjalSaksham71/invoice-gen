export type Invoice = {
  id: number;
  invoice_number: string;
  seller_name: string;
  buyer_name: string;
  status: string;
  grand_total: number;
  created_at: string;
  user_id: string;
};

export interface Product {
  id: string;
  name: string;
  unit_price: number;
  user_id: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
}

export interface InvoiceItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceFormData {
  invoice_number: string;
  seller_id: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
    address: string;
  };
  issue_date: string;
  due_date?: string;
  products: InvoiceItem[];
  discount_percentage: number;
  shipping_charges: number;
  tax_percentage: number;
  notes?: string;
}
