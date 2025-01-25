// import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import { find, map } from 'lodash-es'
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const cookieStore =  cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Fetch data from the database using a query
    const { data: invoice_data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        status,
        created_at,
        updated_at,
        issue_date,
        due_date,
        shipping_charges,
        discount_percentage,
        tax_percentage,
        companies!buyer_id (
            name,
            email
          )
      `)
      .order("created_at", { ascending: false });

    const { data: totals, error: totalsError } = await supabase
      .from('invoice_totals')
      .select('invoice_id, subtotal')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (totalsError) {
      return NextResponse.json({ error: totalsError.message }, { status: 400 });
    }

    // Map and transform data into the desired structure
    const invoices = map(invoice_data,(invoice: any) => {

      const total = find(totals,{invoice_id: invoice.id})?.subtotal || 0;
      const discountedAmount = total - (total * (invoice.discount_percentage || 0)) / 100;
      const amount =
        discountedAmount +
        (invoice.shipping_charges || 0) +
        (discountedAmount * (invoice.tax_percentage || 0)) / 100;

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        createdDate: dayjs(invoice.created_at).format("DD-MM-YYYY"),
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        grand_total: amount,
        buyer: {
          name: invoice.companies?.name  || "Unknown",
          email: invoice.companies?.email
        }
      };
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}