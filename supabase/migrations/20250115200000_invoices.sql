-- Create enum for invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled', 'overdue');

-- Create a table for invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Seller details
    seller_name VARCHAR NOT NULL,
    seller_email VARCHAR,
    seller_phone VARCHAR,
    seller_address TEXT,
    
    -- Buyer details
    buyer_name VARCHAR NOT NULL,
    buyer_phone VARCHAR NOT NULL,
    buyer_email VARCHAR,
    buyer_address TEXT,
    
    -- Invoice details
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status invoice_status DEFAULT 'draft',
    
    -- Totals
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    additional_charges DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Notes
    notes TEXT,
    terms_and_conditions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for invoice items (products)
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Product details
    product_id UUID,  -- Reference to your products table, optional
    product_name VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for additional charges (e.g., tax, shipping)
CREATE TABLE invoice_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    charge_type VARCHAR NOT NULL,
    charge_amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_charges ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
ON invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON invoices FOR DELETE
USING (auth.uid() = user_id);

-- Policies for invoice items
CREATE POLICY "Users can view their own invoice items"
ON invoice_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can create invoice items for their invoices"
ON invoice_items FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can update their own invoice items"
ON invoice_items FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own invoice items"
ON invoice_items FOR DELETE
USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
));

-- Policies for invoice charges
CREATE POLICY "Users can view their own invoice charges"
ON invoice_charges FOR SELECT
USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_charges.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can create invoice charges for their invoices"
ON invoice_charges FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_charges.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can update their own invoice charges"
ON invoice_charges FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_charges.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own invoice charges"
ON invoice_charges FOR DELETE
USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_charges.invoice_id
    AND invoices.user_id = auth.uid()
));

-- Create function to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    WITH totals AS (
        SELECT
            invoice_id,
            SUM(total_amount) AS subtotal,
            SUM(tax_amount) AS tax_amount,
            SUM(discount_amount) AS discount_amount,
            SUM(charge_amount) AS additional_charges
        FROM invoice_items
        LEFT JOIN invoice_charges ON invoice_charges.invoice_id = invoice_items.invoice_id
        WHERE invoice_id = NEW.invoice_id
        GROUP BY invoice_id
    )
    UPDATE invoices
    SET 
        subtotal = totals.subtotal,
        tax_amount = totals.tax_amount,
        discount_amount = totals.discount_amount,
        additional_charges = totals.additional_charges,
        grand_total = totals.subtotal + totals.tax_amount + totals.additional_charges - totals.discount_amount
    FROM totals
    WHERE invoices.id = totals.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update invoice totals
CREATE TRIGGER update_invoice_totals_insert
AFTER INSERT ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER update_invoice_totals_update
AFTER UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER update_invoice_totals_delete
AFTER DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- Insert mock data for testing
-- Insert users into auth table (just for testing purposes, replace with real data)
INSERT INTO auth.users (id, email) VALUES
  ('a1234567-89ab-cdef-0123-456789abcdef', 'user1@example.com'),
  ('b2345678-90bc-def0-1234-56789abcdef0', 'user2@example.com');

-- Insert a sample invoice
INSERT INTO invoices (invoice_number, user_id, seller_name, seller_email, seller_phone, seller_address, buyer_name, buyer_phone, buyer_email, buyer_address, issue_date, due_date)
VALUES
  ('INV-001', 'a1234567-89ab-cdef-0123-456789abcdef', 'Seller1', 'seller1@example.com', '1234567890', '123 Street, City', 'Buyer1', '0987654321', 'buyer1@example.com', '456 Avenue, City', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, product_name, unit_price, quantity, total_amount)
VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'Product 1', 100.00, 2, 200.00),
  ('123e4567-e89b-12d3-a456-426614174001', 'Product 2', 50.00, 1, 50.00);

-- Insert sample charges (e.g., tax, shipping)
INSERT INTO invoice_charges (invoice_id, charge_type, charge_amount, description)
VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'Tax', 15.00, 'GST'),
  ('123e4567-e89b-12d3-a456-426614174001', 'Shipping', 10.00, 'Shipping Charge');
