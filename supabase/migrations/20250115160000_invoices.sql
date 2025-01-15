-- Create enum for invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled', 'overdue');

-- Create invoices table
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Seller details (can be pulled from user profile if you want)
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create invoice items table for products
CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Product details
    product_id VARCHAR,  -- Optional reference to your products table if you have one
    product_name VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
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

-- Create policies for invoice items
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

-- Create function to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    WITH totals AS (
        SELECT 
            invoice_id,
            SUM(total_amount) as subtotal,
            SUM(tax_amount) as tax_amount
        FROM invoice_items
        WHERE invoice_id = NEW.invoice_id
        GROUP BY invoice_id
    )
    UPDATE invoices
    SET 
        subtotal = totals.subtotal,
        tax_amount = totals.tax_amount,
        grand_total = totals.subtotal + totals.tax_amount + additional_charges - discount_amount
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