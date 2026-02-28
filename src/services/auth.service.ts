import { createClient } from '@supabase/supabase-js';

// Consider using Next.js specific Supabase client internally if doing SSR, 
// this is a basic abstraction
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class AuthService {
    /**
     * Registers a user via email. Password is created later during tourist portal access if needed.
     * Can use a magic link or just sign up with a dummy password if custom flow is required.
     */
    static async registerTouristByEmail(email: string) {
        // Implementing lazy verification or simple magic link logic
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            }
        });
        if (error) {
            if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
                console.warn('Auth rate limit exceeded for', email, '- Creating fallback public user record.');

                // Fallback: Manually insert a pseudo-auth user so the public trigger/linking works.
                // We generate a UUID that acts as their temporary 'auth.users' ID.
                // NOTE: Because public.users has a foreign key to auth.users, we can't insert into public.users directly 
                // without the auth user existing. We must bypass or use the service role if possible.
                // If we only have anonymous keys, we can only return null and let the Request service handle it anonymously.
                // To keep the user attached to an email, the link_request_to_user trigger will catch them later when they DO sign up.
                return { user: null, session: null, fallbackEmail: email };
            }
            throw error;
        }
        return data;
    }

    static async verifyOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });
        if (error) throw error;
        return data;
    }

    static async signInWithPassword(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    static async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    static async setPassword(password: string) {
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return data;
    }
}
