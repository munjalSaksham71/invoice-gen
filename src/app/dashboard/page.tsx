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
import { Pencil, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice } from '@/types/invoice'
import { Badge } from '@/components/ui/badge' 

// Define the shape of your Invoice
const columnHelper = createColumnHelper<Invoice>()

// Define columns for TanStack Table
const columns = [
  columnHelper.accessor('id', {
    header: 'S.No',
    cell: info => info.getValue(),
    size: 80,
    enableSorting: false,
  }),
  columnHelper.accessor('invoice_number', {
    header: 'Invoice Number',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('seller_name', {
    header: 'Seller',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('buyer_name', {
    header: 'Buyer',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue()
      let backgroundColor = '#F3F4F6' 
      let textColor = '#374151'
  
      if (status === 'sent') {
        backgroundColor = '#D1FAE5' 
        textColor = '#065F46'
      } else if (status === 'draft') {
        backgroundColor = '#FEF3C7' 
        textColor = '#92400E'
      } else if (status === 'paid') {
        backgroundColor = '#DBEAFE'
        textColor = '#1E40AF'
      }
  
      return (
        <Badge
          style={{
            backgroundColor,
            color: textColor,
            borderRadius: '12px', // Increased border-radius for chip-like appearance
            padding: '4px 12px', // Padding for better spacing
            fontSize: '0.875rem', // Smaller font size
            fontWeight: '500', // Medium font weight
            border: '1px solid transparent', // Optional: Add a border if needed
          }}
        >
          {status}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('grand_total', {
    header: 'Amount',
    cell: info => `$${info.getValue().toFixed(2)}`,
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: props => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log('Edit invoice:', props.row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    ),
    size: 80,
  }),
]

// Main Dashboard Component
export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  // Configure TanStack Table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  })

  // Fetch Invoices from Supabase
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setData(invoices || [])
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Table Section */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={
                      header.id === 'id' ? 'sticky left-0 bg-white' :
                      header.id === 'actions' ? 'sticky right-0 bg-white' : ''
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUpDown className="ml-2 h-4 w-4" />,
                          desc: <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === 'id' ? 'sticky left-0 bg-white' :
                      cell.column.id === 'actions' ? 'sticky right-0 bg-white' : ''
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Total {data.length} invoices
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}