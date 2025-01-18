'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import  InvoiceForm  from '@/components/invoices/invoice-form'
import { InvoiceFormValues } from '@/lib/schemas/invoice'
import { supabase } from '@/lib/supabase'

export default function NewInvoicePage() {
  const router = useRouter()

  const handleSubmit = useCallback(async (data: InvoiceFormValues) => {
    try {
      // Fetch the authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) {
        throw new Error('User is not authenticated');
      }
  
      // Insert buyer company first
      const { data: buyerData, error: buyerError } = await supabase
        .from('companies')
        .insert({
          user_id: user.id, // Include the authenticated user's ID
          name: data.buyer.name,
          email: data.buyer.email,
          phone: data.buyer.phone,
          address: data.buyer.address,
          is_seller: false
        })
        .select()
        .single();
  
      if (buyerError) throw buyerError;
  
      // Insert invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id, // Include the authenticated user's ID
          invoice_number: data.invoice_number,
          seller_id: data.seller_id,
          buyer_id: buyerData.id,
          status: 'draft',
          issue_date: data.issue_date,
          due_date: data.due_date,
          discount_percentage: data.discount_percentage,
          shipping_charges: data.shipping_charges,
          tax_percentage: data.tax_percentage,
          notes: data.notes
        })
        .select()
        .single();
  
      if (invoiceError) throw invoiceError;
  
      // Insert invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          data.products.map(product => ({
            invoice_id: invoiceData.id,
            product_id: product.product_id,
            quantity: product.quantity,
            unit_price: product.unit_price
          }))
        );
  
      if (itemsError) throw itemsError;
  
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error creating invoice:', error);
      // Here you would typically show an error toast/notification
    }
  }, [router]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create New Invoice</h1>
      <InvoiceForm onSubmit={handleSubmit} />
    </div>
  )
}