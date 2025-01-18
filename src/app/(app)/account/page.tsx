'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function AccountSection() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formValues, setFormValues] = useState<User | null>(null);

  // Fetch user details from Supabase
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User is not authenticated');
        }
        const { data, error } = await supabase
        .from('companies') // Replace with the actual table name
        .select('*')
        .eq('user_id', user.id) // Replace 'id' with 'user_id'
        .eq('is_seller', true) // Match 'is_seller = TRUE'
        .single(); // Fetch a single row

        if (error) throw error;
        setUserDetails(data);
        setFormValues(data);
        // Initialize form values
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormValues(userDetails); // Reset form values to original data
    setEditMode(false);
  };

  const handleSave = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('users') // Replace with the actual table name
        .update({
          name: formValues.name,
          email: formValues.email,
          phone: formValues.phone,
          address: formValues.address,
        })
        .eq('id', userDetails.id);

      if (error) throw error;

      setUserDetails(formValues); // Update displayed data
      setEditMode(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating user details:', error);
    }
  }, [formValues, userDetails, router]);

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormValues((prev:any) => ({ ...prev, [name]: value }));
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Account Details</h1>
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              disabled={!editMode}
              value={formValues.name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              disabled={!editMode}
              value={formValues.email}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              disabled={!editMode}
              value={formValues.phone}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Address</label>
            <textarea
              name="address"
              disabled={!editMode}
              value={formValues.address}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            ></textarea>
          </div>
        {editMode ? <div className="flex space-x-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded">
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-black rounded">
              Cancel
            </button>
          </div>
          :
          <div className="flex space-x-4">
             <button 
            onClick={handleEdit} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Edit
          </button>
          </div>}
        </div>

    </div>
  );
}
