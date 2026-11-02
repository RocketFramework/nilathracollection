const fs=require('fs');
const src=fs.readFileSync('scratch/check_db.js','utf8');
const url=src.match(/const url = "([^"]+)"/)[1], key=src.match(/const key = "([^"]+)"/)[1];
const db=require('@supabase/supabase-js').createClient(url,key);
const id='e9e1a358-0dfe-462f-9881-ad5ea920f15e';
(async()=>{
  const {data,error}=await db.from('app_states').select('*').like('state_key','%'+id+'%');
  console.log(error?.message,(data||[]).map(r=>({key:r.state_key,upd:r.updated_at,itin:r.state_data?.itinerary?.length,dba:r.state_data?.dbActivities?.length,track:r.state_data?.track,keys:Object.keys(r.state_data||{})})));
})();
