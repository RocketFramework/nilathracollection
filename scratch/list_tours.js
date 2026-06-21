const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTours() {
  const { data: tours, error } = await supabase
    .from('tours')
    .select('id, title, status, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching tours:', error);
    return;
  }

  console.log('Tours in database:');
  tours.forEach(t => {
    console.log(`ID: ${t.id}, Title: ${t.title}, Status: ${t.status}, Updated: ${t.updated_at}`);
  });
}

listTours();
