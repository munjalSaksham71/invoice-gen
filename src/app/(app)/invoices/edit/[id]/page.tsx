/** eslint-disable */
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import InvoiceForm from "@/components/invoices/invoice-form";
import { InvoiceFormValues } from "@/lib/schemas/invoice";
import { supabase } from "@/lib/supabase";

const EditInvoicePage = ({ params }: any) => {
  const router = useRouter();
  const [initialData, setInitialData] = useState<Partial<InvoiceFormValues>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Fetch invoice with related data
        const { data: invoice, error: invoiceError }: any = await supabase
          .from("invoices")
          .select(
            `
            *,
            invoice_items (
              product_id,
              quantity,
              unit_price
            )
          `
          )
          .eq("id", params.id)
          .single();

        if (invoiceError) throw invoiceError;

        setInitialData({
          invoice_number: invoice.invoice_number,
          seller_id: invoice.seller_id,
          buyer_id: invoice.buyer_id,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          products: invoice.invoice_items,
          discount_percentage: invoice.discount_percentage,
          shipping_charges: invoice.shipping_charges,
          tax_percentage: invoice.tax_percentage,
          notes: invoice.notes,
        });
      } catch (error) {
        console.error("Error fetching invoice:", error);
        router.push("/invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id, router]);

  const handleSubmit = useCallback(
    async (data: InvoiceFormValues) => {
      try {
        // Fetch the authenticated user's ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User is not authenticated");
        }

        // Update invoice
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            invoice_number: data.invoice_number,
            seller_id: data.seller_id,
            buyer_id: data.buyer_id,
            issue_date: data.issue_date,
            due_date: data.due_date,
            discount_percentage: data.discount_percentage,
            shipping_charges: data.shipping_charges,
            tax_percentage: data.tax_percentage,
            notes: data.notes,
          })
          .eq("id", params.id)
          .eq("user_id", user.id); // Ensure the invoice belongs to the authenticated user

        if (invoiceError) throw invoiceError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", params.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            data.products.map((product) => ({
              invoice_id: params.id,
              product_id: product.product_id,
              quantity: product.quantity,
              unit_price: product.unit_price,
            }))
          );

        if (itemsError) throw itemsError;

        router.push("/invoices");
        router.refresh();
      } catch (error) {
        console.error("Error updating invoice:", error);
      }
    },
    [params.id, router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit Invoice</h1>
      <InvoiceForm initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditInvoicePage;
