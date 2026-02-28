import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://vknibpdhovgcbenkcnaz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTk3MDUsImV4cCI6MjA4NzU3NTcwNX0.gllt4Cf-5PSd4mnxZYDfcEemZPPQBNJUSr93xziVwAY');

async function test() {
    const { data, error } = await supabase.from('requests').insert({
        request_type: 'package',
        email: 'test@example.com'
    }).select();
    console.log("Insert result:", error || "Success");
}
test();
