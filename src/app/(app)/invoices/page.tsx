'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { Pencil, ArrowUpDown, Plus, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { InvoiceItem, InvoiceFormData, Product } from '@/types/invoice'
import { generateInvoicePdf } from '@/lib/generatePdf'

type Invoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue'
  buyer: {
    name: string
    email: string
  }
  issue_date: string
  grand_total: number
}

const columnHelper = createColumnHelper<Invoice>()

const columns = [
  // New S.No column
  // columnHelper.display({
  //   id: 'serialNumber',
  //   header: () => {
  //     return (
  //       <div className="text-center font-medium text-gray-600">
  //         S.No
  //       </div>
  //     )
  //   },
  //   cell: (props) => (
  //     <div className="text-center font-medium text-gray-600">
  //       {props.row.index + 1}
  //     </div>
  //   ),
  // }),
  columnHelper.accessor('invoice_number', {
    enableSorting: true,
    header: ({ column }) => {
      return (
        <div
          className="cursor-pointer select-none flex items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
    cell: info => (
      <span className="font-medium text-blue-600">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('buyer.name', {
    header: 'Buyer Name',
    cell: info => (
      <span className="text-gray-700">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue()
      let className = "capitalize rounded-full px-4 py-1 text-sm font-medium "
      
      switch (status) {
        case 'paid':
          className += "bg-green-100 text-green-700 border border-green-200"
          break
        case 'sent':
          className += "bg-blue-100 text-blue-700 border border-blue-200"
          break
        case 'draft':
          className += "bg-gray-100 text-gray-700 border border-gray-200"
          break
        case 'cancelled':
          className += "bg-red-100 text-red-700 border border-red-200"
          break
        case 'overdue':
          className += "bg-yellow-100 text-yellow-700 border border-yellow-200"
          break
      }
      
      return (
        <span className={className}>
          {status}
        </span>
      )
    },
  }),
  columnHelper.accessor('grand_total', {
    header: ({ column }) => {
      return (
        <div
          className="cursor-pointer select-none flex items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
    cell: info => (
      <span className="font-medium text-emerald-600">
        ₹{info.getValue().toFixed(2)}
      </span>
    ),
  }),
  columnHelper.accessor('issue_date', {
    header: ({ column }) => {
      return (
        <div
          className="cursor-pointer select-none flex items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
    cell: info => (
      <span>
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => {
      return (
        <div className="text-center">Actions</div>
      )
    },
    cell: props => {
      const router = useRouter();
      const id = props.row.original.id

      const handleDownload = async () => {
        try {
          // Fetch the full invoice data including invoice_items and buyer details
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
              *,
              companies!buyer_id (
                name,
                email,
                phone,
                address
              ),
              invoice_items (
                product_id,
                quantity,
                unit_price
              )
            `)
            .eq('id', id)
            .single();
      
          if (invoiceError) throw invoiceError;
      
          // Fetch seller data
          const { data: seller, error: sellerError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', invoice.seller_id)
            .single();
      
          if (sellerError) throw sellerError;
      
          // Fetch products data using the product IDs from invoice_items
          const productIds = invoice.invoice_items.map((item: InvoiceItem) => item.product_id);
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);
      
          if (productsError) throw productsError;
      
          // Transform invoice_items into products with additional details
          const invoiceProducts = invoice.invoice_items.map((item: InvoiceItem) => {
            const product = products.find((p: Product) => p.id === item.product_id);
            return {
              ...item,
              name: product ? product.name : 'Unknown Product',
            };
          });
      
          // Prepare the data for the PDF generator
          const invoiceData: InvoiceFormData = {
            invoice_number: invoice.invoice_number,
            seller_id: invoice.seller_id,
            buyer: {
              name: invoice.companies.name,
              email: invoice.companies.email,
              phone: invoice.companies.phone,
              address: invoice.companies.address,
            },
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            products: invoice.invoice_items,
            discount_percentage: invoice.discount_percentage,
            shipping_charges: invoice.shipping_charges,
            tax_percentage: invoice.tax_percentage,
            notes: invoice.notes,
          };
      
          // Generate and download the PDF
          generateInvoicePdf(invoiceData, seller, invoiceProducts);
        } catch (error) {
          console.error('Error generating PDF:', error);
        }
      };

      return ( <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
          onClick={() => router.push(`/invoices/edit/${id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-green-50 hover:text-green-600 transition-colors"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>

      </div>)
    }
  }),
]

export default function Invoices() {
  const router = useRouter()
  const [data, setData] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            status,
            issue_date,
            companies!buyer_id (
              name,
              email
            )
          `)
          .order('created_at', { ascending: false })

        if (invoicesError) throw invoicesError

        const { data: totals, error: totalsError } = await supabase
          .from('invoice_totals')
          .select('invoice_id, grand_total')

        if (totalsError) throw totalsError

        const totalsMap = new Map(
          totals.map(total => [total.invoice_id, total.grand_total])
        )

        const transformedData = invoices.map((invoice: any)  => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          buyer: {
            name: invoice.companies?.name,
            email: invoice.companies?.email
          },
          issue_date: invoice.issue_date,
          grand_total: totalsMap.get(invoice.id) || 0
        }))

        setData(transformedData)
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-blue-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          Invoices
        </h1>
        <div className="flex gap-4">
          <Button 
            onClick={() => router.push('/invoices/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="bg-gray-50 border-b">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="py-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow 
                key={row.id}
                className="hover:bg-blue-50/50 transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Total {data.length} invoices
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}