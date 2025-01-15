'use client'

import { useEffect, useState } from 'react'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { UseFieldArrayReturn, Control } from 'react-hook-form'
import { InvoiceFormValues } from '@/lib/schemas/invoice'
import { Product } from '@/types/invoice'
import { supabase } from '@/lib/supabase'

interface ProductTableProps {
  control: Control<InvoiceFormValues>
  fieldArray: UseFieldArrayReturn<InvoiceFormValues, "products", "id">
}

export default function ProductTable({ control, fieldArray }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const { fields, append, remove } = fieldArray

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, unit_price')
      if (data) setProducts(data)
    }
    fetchProducts()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Products</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center">
        <div className="font-medium text-sm text-gray-500">Product</div>
        <div className="font-medium text-sm text-gray-500 w-24 text-center">Quantity</div>
        <div className="font-medium text-sm text-gray-500 w-32 text-center">Price</div>
        <div className="w-10"></div>
      </div>
      
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-start">
          <FormField
            control={control}
            name={`products.${index}.product_id`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      const product = products.find(p => p.id === value)
                      if (product) {
                        control._fields[`products.${index}.unit_price`]._f.value = product.unit_price
                      }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`products.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    className="w-24"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`products.${index}.unit_price`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-32"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  )
}