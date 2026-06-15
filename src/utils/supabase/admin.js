"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client with Service Role Key to bypass RLS and use Admin API
const createAdminClient = () => {
    return (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
exports.createAdminClient = createAdminClient;
