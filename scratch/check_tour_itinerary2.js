const fs=require('fs');
const src=fs.readFileSync('scratch/check_db.js','utf8');
const url=src.match(/const url = "([^"]+)"/)[1], key=src.match(/const key = "([^"]+)"/)[1];
const db=require('@supabase/supabase-js').createClient(url,key);
const id='e9e1a358-0dfe-462f-9881-ad5ea920f15e';
(async()=>{
  const {data:t}=await db.from('tours').select('planner_data').eq('id',id).single();
  const it=t.planner_data.itinerary;
  console.log('sample',JSON.stringify(it[0]).slice(0,400));
  console.log('days',[...new Set(it.map(i=>i.day??i.dayNumber))].slice(0,20));
  const {data:da,error}=await db.from('daily_activities').select('*').eq('tour_id',id).limit(3);
  console.log('da',error?.message,da?.length, da&&da[0]&&Object.keys(da[0]).slice(0,30));
  const {count}=await db.from('daily_activities').select('*',{count:'exact',head:true}).eq('tour_id',id);
  console.log('da count',count);
})();
