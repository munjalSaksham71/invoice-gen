'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Control } from 'react-hook-form'
import { InvoiceFormValues } from '@/lib/schemas/invoice'

interface InvoiceSummaryProps {
  control: Control<InvoiceFormValues>
  subtotal: number
  discount: number
  tax: number
  grandTotal: number
}

export default function InvoiceSummary({ 
  control, 
  subtotal,
  discount,
  tax,
  grandTotal 
}: InvoiceSummaryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invoice Summary</h3>
      
      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
      
      <FormField
        control={control}
        name="discount_percentage"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="flex-1">Discount %</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-24"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </div>
            <div className="flex justify-end text-sm text-gray-500 mt-1">
              -₹{discount.toFixed(2)}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="tax_percentage"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="flex-1">Tax %</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-24"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </div>
            <div className="flex justify-end text-sm text-gray-500 mt-1">
              +₹{tax.toFixed(2)}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="shipping_charges"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="flex-1">Shipping Charges</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-24"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-4 border-t">
        <div className="flex justify-between font-semibold">
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}