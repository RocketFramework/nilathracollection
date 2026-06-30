const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

async function run() {
    const res = await fetch(url + '/rest/v1/', {
        headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key
        }
    });
    const doc = await res.json();
    console.log("Exposed RPC paths:");
    const paths = Object.keys(doc.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log(rpcs);
}
run();
