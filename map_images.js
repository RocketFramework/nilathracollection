const fs = require('fs');

const activities = JSON.parse(fs.readFileSync('activities_75_258.json', 'utf8'));

// Keywords to match with existing image arrays
const mapping = [
    { keywords: ['fruit market'], images: ['/images/activities/fruit_market_pettah_1.png', '/images/activities/fruit_market_pettah_2.png', '/images/activities/fruit_market_pettah_3.png'] },
    { keywords: ['barbecue (mirissa)'], images: ['/images/activities/seafood_bbq_mirissa_1.png', '/images/activities/seafood_bbq_mirissa_2.png', '/images/activities/seafood_bbq_mirissa_3.png'] },
    { keywords: ['barbecue (unawatuna)'], images: ['/images/activities/seafood_bbq_unawatuna_1.png', '/images/activities/seafood_bbq_unawatuna_2.png', '/images/activities/seafood_bbq_unawatuna_3.png'] },
    { keywords: ['make hoppers (colombo)'], images: ['/images/activities/make_hoppers_colombo_1.png', '/images/activities/make_hoppers_colombo_2.png', '/images/activities/make_hoppers_colombo_3.png'] },
    { keywords: ['safari', 'national park'], images: ['/images/activities/yala_safari_1.png', '/images/activities/yala_safari_2.png', '/images/activities/yala_safari_3.png'] },
    { keywords: ['hike', 'trek', 'climb', 'peak', 'rock'], images: ['/images/activities/climbing_sigiriya_rock_1.png', '/images/activities/climbing_sigiriya_rock_2.png', '/images/activities/climbing_sigiriya_rock_3.png'] },
    { keywords: ['surf', 'board'], images: ['/images/activities/surfing_hiriketiya_1.png', '/images/activities/surfing_hiriketiya_2.png', '/images/activities/surfing_hiriketiya_3.png'] },
    { keywords: ['sea', 'beach', 'relax'], images: ['/images/activities/relaxing_mirissa_1.png', '/images/activities/relaxing_mirissa_2.png', '/images/activities/relaxing_mirissa_3.png'] },
    { keywords: ['swim', 'snork'], images: ['/images/activities/snorkeling_pigeon_island_1.png', '/images/activities/snorkeling_pigeon_island_2.png', '/images/activities/snorkeling_pigeon_island_3.png'] },
    { keywords: ['whale', 'dolphin'], images: ['/images/activities/whale_watching_mirissa_1.png', '/images/activities/whale_watching_mirissa_2.png', '/images/activities/whale_watching_mirissa_3.png'] },
    { keywords: ['turtle'], images: ['/images/activities/turtle_watching_kosgoda_1.png', '/images/activities/turtle_watching_kosgoda_2.png', '/images/activities/turtle_watching_kosgoda_3.png'] },
    { keywords: ['tea factory', 'tea estate', 'tea pluck', 'tea tast'], images: ['/images/activities/tea_tasting_nuwara_eliya_1.png', '/images/activities/tea_tasting_nuwara_eliya_2.png', '/images/activities/tea_tasting_nuwara_eliya_3.png'] },
    { keywords: ['cooking class', 'make hopper'], images: ['/images/activities/cooking_class_colombo_1.png', '/images/activities/cooking_class_colombo_2.png', '/images/activities/cooking_class_colombo_3.png'] },
    { keywords: ['street food', 'food tour', 'crab curry'], images: ['/images/activities/street_food_colombo_1.png', '/images/activities/street_food_colombo_2.png', '/images/activities/street_food_colombo_3.png'] },
    { keywords: ['temple', 'kovil', 'mosque', 'viharaya', 'sacred', 'relic'], images: ['/images/activities/temple_of_the_tooth_1.png', '/images/activities/temple_of_the_tooth_2.png', '/images/activities/temple_of_the_tooth_3.png'] },
    { keywords: ['fort', 'ruin', 'ancient'], images: ['/images/activities/galle_fort_ramparts_1.png', '/images/activities/galle_fort_ramparts_2.png', '/images/activities/galle_fort_ramparts_3.png'] },
    { keywords: ['museum'], images: ['/images/activities/national_museum_colombo_1.png', '/images/activities/national_museum_colombo_2.png', '/images/activities/national_museum_colombo_3.png'] },
    { keywords: ['train'], images: ['/images/activities/scenic_train_ride_1.png', '/images/activities/scenic_train_ride_2.png', '/images/activities/scenic_train_ride_3.png'] },
    { keywords: ['massage', 'yoga', 'ayurved', 'wellness', 'meditat', 'retreat', 'steam'], images: ['/images/activities/ayurvedic_massage_1.png', '/images/activities/ayurvedic_massage_2.png', '/images/activities/ayurvedic_massage_3.png'] },
    { keywords: ['falls', 'waterfall'], images: ['/images/activities/bambarakanda_falls_1.png', '/images/activities/bambarakanda_falls_2.png', '/images/activities/bambarakanda_falls_3.png'] },
    { keywords: ['botanical'], images: ['/images/activities/peradeniya_botanical_gardens_1.png', '/images/activities/peradeniya_botanical_gardens_2.png', '/images/activities/peradeniya_botanical_gardens_3.png'] }
];

const assignedActivities = [];
const unassignedActivities = [];

activities.forEach(activity => {
    // skip if already has images
    if (activity.images && activity.images.length > 0) return;

    const name = activity.activity_name.toLowerCase();
    const category = activity.category.toLowerCase();

    let matched = false;
    for (const map of mapping) {
        if (map.keywords.some(kw => name.includes(kw) || category.includes(kw))) {
            assignedActivities.push({
                id: activity.id,
                name: activity.activity_name,
                images: map.images,
                matchType: map.keywords[0]
            });
            matched = true;
            break;
        }
    }

    if (!matched) {
        unassignedActivities.push(activity);
    }
});

fs.writeFileSync('assigned_activities_75_258.json', JSON.stringify(assignedActivities, null, 2));
fs.writeFileSync('unassigned_activities_75_258.json', JSON.stringify(unassignedActivities, null, 2));

console.log(`Assigned existing images to ${assignedActivities.length} activities.`);
console.log(`${unassignedActivities.length} activities still need images.`);

// Print a few assigned to verify
console.log("\nSample of Assigned:");
assignedActivities.slice(0, 5).forEach(a => console.log(`- [${a.matchType}] ${a.id}: ${a.name}`));

console.log("\nSample of Unassigned:");
unassignedActivities.slice(0, 5).forEach(a => console.log(`- ${a.id}: ${a.activity_name}`));

