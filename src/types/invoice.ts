export type Invoice = {
    id: number;
    invoice_number: string;
    seller_name: string; 
    buyer_name: string;
    status: string;
    grand_total: number; 
    created_at: string;
    user_id: string;
  }
  