const fs=require('fs');
const src=fs.readFileSync('scratch/check_db.js','utf8');
const url=src.match(/const url = "([^"]+)"/)[1], key=src.match(/const key = "([^"]+)"/)[1];
const { createClient } = require('@supabase/supabase-js');
const db=createClient(url,key);
const id='e9e1a358-0dfe-462f-9881-ad5ea920f15e';
(async()=>{
  const {data:t,error}=await db.from('tours').select('id,tour_code,title,status,start_date,end_date,updated_at,created_at,planner_data').eq('id',id).single();
  console.log('tour',error?.message, t&&{...t,planner_data:undefined});
  const pd=t?.planner_data; console.log('planner_data keys', pd&&Object.keys(pd), 'itinerary len', Array.isArray(pd?.itinerary)?pd.itinerary.length:typeof pd?.itinerary);
  const {data:da,error:e2}=await db.from('daily_activities').select('id,day_number,activity_type,title,created_at,updated_at').eq('tour_id',id);
  console.log('daily_activities',e2?.message,da?.length);
  const {data:ver,error:e3}=await db.from('tour_versions').select('*').eq('tour_id',id).limit(5);
  console.log('versions',e3?.message,ver?.length);
  const {data:lg}=await db.from('system_logs').select('*').order('created_at',{ascending:false}).limit(0);
})();
