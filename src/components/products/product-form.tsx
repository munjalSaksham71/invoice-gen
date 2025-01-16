"use client"

import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/invoice";
import { useEffect } from "react";

type ProductFormProps = {
  defaultValues?: Product;
  onSubmit: SubmitHandler<Product>;
  onClose: () => void;
};

export default function ProductForm({ defaultValues, onSubmit, onClose }: ProductFormProps) {
  const { register, handleSubmit, reset } = useForm<Product>({
    defaultValues,
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {defaultValues ? "Edit Product" : "Add Product"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input
            {...register("name", { required: "Name is required" })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <Textarea
            {...register("description")}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <Input
            type="number"
            step="0.01"
            {...register("unit_price", { required: "Price is required" })}
            className="mt-1"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {defaultValues ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}