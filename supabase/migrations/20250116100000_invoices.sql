-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled', 'overdue');

-- Create companies table to store seller/buyer information
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    is_seller BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES companies(id),
    buyer_id UUID NOT NULL REFERENCES companies(id),
    status invoice_status DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    shipping_charges DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    unit_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own records" ON companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own records" ON companies FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own records" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own records" ON invoices FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own records" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own records" ON products FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own records" ON invoice_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can modify their own records" ON invoice_items FOR ALL 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- Create view for invoice totals
CREATE OR REPLACE VIEW invoice_totals AS
SELECT 
    i.id as invoice_id,
    COALESCE(SUM(ii.quantity * ii.unit_price), 0) as subtotal,
    COALESCE(SUM(ii.quantity * ii.unit_price) * (i.tax_percentage / 100), 0) as tax_amount,
    COALESCE(SUM(ii.quantity * ii.unit_price) * (i.discount_percentage / 100), 0) as discount_amount,
    i.shipping_charges,
    COALESCE(SUM(ii.quantity * ii.unit_price), 0) + 
    COALESCE(SUM(ii.quantity * ii.unit_price) * (i.tax_percentage / 100), 0) + 
    i.shipping_charges - 
    COALESCE(SUM(ii.quantity * ii.unit_price) * (i.discount_percentage / 100), 0) as grand_total
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.tax_percentage, i.discount_percentage, i.shipping_charges;