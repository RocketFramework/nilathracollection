const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.trim().startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('app_settings').select('*').then(({data,error})=>{ if(error) return console.log(error); data.filter(r=>/company/i.test(JSON.stringify(r))).forEach(r=>console.log(JSON.stringify(r))); console.log('total',data.length, 'cols', Object.keys(data[0]||{}).join(',')); });
