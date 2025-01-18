'use client'
import LoginForm from '@/components/auth/login-form'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
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

  return <LoginForm />
}