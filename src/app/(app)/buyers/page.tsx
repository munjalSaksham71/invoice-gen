"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BuyerForm from "@/components/buyers/buyer-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Pencil, ArrowUpDown, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Company } from "@/types/invoice";

type Buyer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
};

const createColumns = (handleEdit: (buyer: Buyer) => void) => {
  const columnHelper = createColumnHelper<Buyer>();

  return [
    columnHelper.accessor("name", {
      enableSorting: true,
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        );
      },
      cell: (info) => (
        <span className="font-medium text-gray-900">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor("address", {
      header: "Address",
      cell: (info) => (
        <span className="text-gray-600 max-w-xs truncate block">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("created_at", {
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        );
      },
      cell: (info) => (
        <span className="text-gray-600">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: (props) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
              onClick={() => handleEdit(props.row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }),
  ];
};

export default function BuyersTable() {
  const router = useRouter();
  const [data, setData] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Company | null>(null);

  const handleEdit = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setIsDrawerOpen(true);
  };

  const columns = createColumns(handleEdit);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: buyers, error } = await supabase
          .from("companies")
          .select("*")
          .eq("is_seller", false)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setData(buyers);
      } catch (error) {
        console.error("Error fetching buyers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Companies</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              setIsDrawerOpen(true);
              setSelectedBuyer(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50 border-b">
                {headerGroup.headers.map((header) => (
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-blue-50/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
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
        <div className="text-sm text-gray-600">Total {data.length} buyers</div>
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
      {isDrawerOpen && (
        <div
          className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <BuyerForm
            defaultValues={selectedBuyer || undefined}
            onClose={() => setIsDrawerOpen(false)}
            onSubmit={() => {}}
          />
        </div>
      )}
    </div>
  );
}
