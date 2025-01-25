// types/dashboard.ts

export interface DashboardMetrics {
    overallRevenue: number;
    lastThreeMonthsSales: {
      month: string;
      revenue: number;
      invoiceCount: number;
    }[];
    newCustomersThisMonth: number;
    topProducts: {
      name: string;
      revenue: number;
      quantity: number;
    }[];
    revenueByMonth: {
      month: string;
      revenue: number;
    }[];
  }
  
  export interface Invoice {
    id: string;
    invoice_number: string;
    buyer_id: string;
    seller_id: string;
    status: string;
    issue_date: string;
    due_date: string;
    discount_percentage: number;
    shipping_charges: number;
    tax_percentage: number;
    items: InvoiceItem[];
  }
  
  export interface InvoiceItem {
    id: string;
    invoice_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
  }
  
  export interface Company {
    id: string;
    user_id: string;
    name: string;
    email: string;
    is_seller: boolean;
  }
  
  export interface Product {
    id: string;
    user_id: string;
    name: string;
    unit_price: number;
  }