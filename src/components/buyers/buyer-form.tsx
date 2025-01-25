"use client"

import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { Company } from "@/types/invoice";

type BuyerFormProps = {
  defaultValues?: Company;
  onSubmit: SubmitHandler<Company>;
  onClose: () => void;
};

export default function BuyerForm({ defaultValues, onSubmit, onClose }: BuyerFormProps) {
  const { register, handleSubmit, reset } = useForm<Company>({
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
        {defaultValues ? "Edit Company" : "Add Company"}
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
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            step="0.01"
            {...register("email")}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <Input
            type="number"
            step="0.01"
            {...register("phone", { required: "Phone number is required" })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <Textarea
            {...register("address")}
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