'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Company } from '@/types/invoice';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const AccountForm = ({ 
  isEditing, 
  onSave, 
  onCancel, 
  defaultValues 
}: { 
  isEditing: boolean;
  onSave: (data: Company) => void;
  onCancel: () => void;
  defaultValues: Company;
}) => {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Company>({
    defaultValues,
    mode: 'onBlur',
  });

  // Reset form when defaultValues change
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const inputClasses = "mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = "text-red-500 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          {...register('name', { required: 'Name is required' })}
          disabled={!isEditing}
          className={inputClasses}
        />
        {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          disabled={!isEditing}
          className={inputClasses}
        />
        {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          type="tel"
          {...register('phone', {
            pattern: {
              value: /^[0-9+-]+$/,
              message: 'Invalid phone number'
            }
          })}
          disabled={!isEditing}
          className={inputClasses}
        />
        {errors.phone && <p className={errorClasses}>{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Address</label>
        <textarea
          {...register('address', { required: 'Address is required' })}
          disabled={!isEditing}
          className={`${inputClasses} min-h-[100px]`}
        />
        {errors.address && <p className={errorClasses}>{errors.address.message}</p>}
      </div>

      {isEditing && (
        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={!isDirty}
            className="px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </Button>
          <Button
            type="button"
            variant={'outline'}
            onClick={onCancel}
            className="px-4 py-2 text-black rounded"
          >
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};

export default function AccountSection() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User is not authenticated');

        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_seller', true)
          .single();

        if (error) throw error;
        setCompanyData(data);
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleSave = async (formData: Company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        })
        .eq('id', companyData?.id)
        .eq('is_seller', true);

      if (error) throw error;

      setCompanyData(formData);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating company details:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-red-500">No company data found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Account Details</h1>
        {!isEditing && (
          <Button
          variant='link'
            onClick={() => setIsEditing(true)}
            className="px-4 py-2  rounded "
          >
            Edit
          </Button>
        )}
      </div>

      <AccountForm
        key={isEditing? 'editing' : 'viewing'}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
        defaultValues={companyData}
      />
    </div>
  );
}