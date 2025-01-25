import * as z from 'zod'

export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  seller_id: z.string().uuid('Please select a seller'),
  buyer_id: z.string().uuid('Please select a buyer'),
  issue_date: z.string(),
  due_date: z.string().optional(),
  products: z.array(z.object({
    product_id: z.string().uuid('Please select a product'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price must be positive'),
  })).min(1, 'At least one product is required'),
  discount_percentage: z.number().min(0).max(100).default(0),
  shipping_charges: z.number().min(0).default(0),
  tax_percentage: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>