'use client'
import SignupForm from '@/components/auth/signup-form'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignupPage() {
    const router = useRouter();
    // useEffect(() => {
    //     const checkUser = async () => {
    //       const { data: { session } } = await supabase.auth.getSession()
    //       if (session) {
    //         router.push('/')
    //       }
    //     }
        
    //     checkUser()
    //   }, [router])

  return <SignupForm />
}