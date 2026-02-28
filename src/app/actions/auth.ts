'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

export async function loginAction(prevState: any, formData: FormData) {
    // Using email as Supabase uses Email/Password authentication normally
    // However, it can also use username if you have configured it, but let's change our UI slightly or assume 'email' for the system
    // We'll rename username field to email for Supabase or just interpret the username as email
    const email = formData.get('email') as string | null || formData.get('username') as string | null;
    const password = formData.get('password') as string | null;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message };
    }

    redirect('/admin');
}

export async function logoutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    redirect('/admin/login');
}
