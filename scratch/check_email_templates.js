const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

async function run() {
  console.log("Fetching email templates...");
  const { data, error } = await supabase.from('email_templates').select('*');
  if (error) {
    console.error("Error fetching templates:", error);
  } else {
    console.log("Email templates list:", data.map(t => ({ id: t.id, name: t.name, type: t.type, subject: t.subject })));
    console.log("Templates detail:", data);
  }
}

run();
