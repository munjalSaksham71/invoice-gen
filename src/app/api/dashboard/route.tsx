// app/api/dashboard/route.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { DashboardMetrics } from "@/types/dashboard";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get the cookie store
    const cookieStore =  cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    console.log("Start of Month:", startOfMonth);
    console.log("Three Months Ago:", threeMonthsAgo);

    console.log("Fetching invoices...");
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_items (
          *,
          product:products (*)
        )
      `
      )
      .eq("user_id", user.id)
      .gte("issue_date", threeMonthsAgo.toISOString());
    
    console.log("Query executed. Checking for errors...");
    if (invoicesError) {
      console.error("Invoice Error:", invoicesError);
      return NextResponse.json(
        { error: invoicesError.message },
        { status: 500 }
      );
    }
    
    console.log("Fetched Invoices:", invoices);

    // Get new customers this month
    const { count: newCustomers } = await supabase
      .from("companies")
      .select("*", { count: "exact" })
      .eq("is_seller", false)
      .gte("created_at", startOfMonth.toISOString());

    console.log("New Customers Count:", newCustomers);

    // Calculate metrics
    const metrics: DashboardMetrics = {
      overallRevenue: calculateOverallRevenue(invoices),
      lastThreeMonthsSales: calculateMonthlyRevenue(invoices),
      newCustomersThisMonth: newCustomers || 0,
      topProducts: calculateTopProducts(invoices),
      revenueByMonth: calculateRevenueByMonth(invoices),
    };

    console.log("Calculated Metrics:", metrics);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOverallRevenue(invoices: any[]): number {
  return invoices.reduce((total, invoice) => {
    const subtotal = invoice.invoice_items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    );
    const discount = (subtotal * (invoice.discount_percentage || 0)) / 100;
    const tax = (subtotal * (invoice.tax_percentage || 0)) / 100;
    return total + subtotal - discount + tax + (invoice.shipping_charges || 0);
  }, 0);
}

function calculateMonthlyRevenue(invoices: any[]): any[] {
  const monthlyData = new Map();

  invoices.forEach((invoice) => {
    const month = new Date(invoice.issue_date).toLocaleString("default", {
      month: "long",
    });
    const revenue = calculateInvoiceTotal(invoice);

    if (!monthlyData.has(month)) {
      monthlyData.set(month, { revenue: 0, invoiceCount: 0 });
    }

    const data = monthlyData.get(month);
    data.revenue += revenue;
    data.invoiceCount += 1;
  });

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      ...data,
    }))
    .slice(-3);
}

function calculateTopProducts(invoices: any[]): any[] {
  const productStats = new Map();

  invoices.forEach((invoice) => {
    invoice.invoice_items.forEach((item: any) => {
      const product = item.product;
      if (!productStats.has(product.id)) {
        productStats.set(product.id, {
          name: product.name,
          revenue: 0,
          quantity: 0,
        });
      }

      const stats = productStats.get(product.id);
      stats.revenue += item.quantity * item.unit_price;
      stats.quantity += item.quantity;
    });
  });

  return Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function calculateInvoiceTotal(invoice: any): number {
  const subtotal = invoice.invoice_items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_price,
    0
  );
  const discount = (subtotal * (invoice.discount_percentage || 0)) / 100;
  const tax = (subtotal * (invoice.tax_percentage || 0)) / 100;
  return subtotal - discount + tax + (invoice.shipping_charges || 0);
}

function calculateRevenueByMonth(invoices: any[]): any[] {
  const monthlyRevenue = new Map();

  invoices.forEach((invoice) => {
    const month = new Date(invoice.issue_date).toLocaleString("default", {
      month: "long",
    });
    const revenue = calculateInvoiceTotal(invoice);

    monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + revenue);
  });

  return Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}