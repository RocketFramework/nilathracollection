const fs = require('fs');
const data = JSON.parse(fs.readFileSync('planner_data.json', 'utf8'))[0];
const day1Blocks = data.planner_data.itinerary.filter(b => b.dayNumber === 1);
const ids = day1Blocks.map(b => b.id);
console.log(ids.join(','));
