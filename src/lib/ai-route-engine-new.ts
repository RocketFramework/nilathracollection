import { Activity } from "@/data/activities";
import { RoutePlan, GeoLocation, ItineraryDay, ItineraryEvent } from "./route-engine-new";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class AdvancedAiRouteEngine {
    private genAI: GoogleGenerativeAI;
    private startLocation: GeoLocation;

    constructor(startLocation: GeoLocation = { lat: 7.1725, lng: 79.8853, name: 'Katunayake Airport' }) {
        this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
        this.startLocation = startLocation;
    }

    async generatePlan(
        activities: Activity[],
        locations: GeoLocation[],
        durationDays: number,
        customRules?: string,
        travelStyle?: string
    ): Promise<RoutePlan> {

        // System Instructions detailing exact required JSON format and rules
        let systemPrompt = `You are an expert luxury travel itinerary builder for Nilathra Collection in Sri Lanka. 
You will be provided with a list of activities, locations, and the total duration of the trip format in days.
Your objective is to generate a logically routed, perfectly sequenced day-by-day itinerary JSON.

RULES:
1. Limit daily activities to a maximum of 3-4 major events to avoid rushing.
2. Group activities that are geographically close into the same day.
3. Every day should start with Breakfast (around 8:00 AM) and end with sleep/overnight. Include lunch around 1:00 PM and dinner around 7:30 PM.
4. Estimate realistic travel times between different cities (average speed in Sri Lanka is 35km/h).
5. IF an activity absolutely cannot logically fit or makes the day too rushed, add it to a \`droppedActivities\` array at the root level of your JSON response instead of forcing it in.
6. The first day should ideally begin near ${this.startLocation.name} (${this.startLocation.lat}, ${this.startLocation.lng}).
7. Recommend a hotelName for 'sleep' events based on the travelStyle of the tour:
   - 'Ultra VIP': Recommend ultra-exclusive, high-end private villas, boutique estates or 5-star properties (e.g. Cape Weligama, Ani Sri Lanka, Ceylon Tea Trails, Amanwella). Rate rateUsd should be in range 800 - 2500.
   - 'Luxury': Recommend premium 5-star resorts (e.g. 98 Acres Resort, Heritance Kandalama, Amangalla, Wild Coast Tented Lodge). Rate rateUsd should be in range 300 - 800.
   - 'Premium': Recommend good 4-star hotels and quality accommodations (e.g. Jetwing Lighthouse, Cinnamon Wild, Heritance Tea Factory). Rate rateUsd should be in range 150 - 300.
   - 'Regular': Recommend comfortable, standard 3-star accommodations (e.g. Ella Flower Garden Resort, Hotel Sigiriya). Rate rateUsd should be in range 70 - 150.
   - 'Mixed': Recommend a mix of 4-star and 5-star properties. Rate rateUsd should be in range 150 - 500.
8. Recommend a mealPlan for 'sleep' events from ('BB', 'HB', 'FB', 'AI') that fits the daily flow.
9. Recommend a rateUsd for 'sleep' events (number representing room rate per night in USD) according to the travelStyle guidelines above.
`;

        if (customRules) {
            systemPrompt += `\nADDITIONAL CONTEXT & AGENT RULES:\n${customRules}\n`;
        }

        systemPrompt += `\nRETURN EXACTLY A JSON OBJECT MATCHING THIS INTERFACE, WITH NO WRAPPER TEXT OR MARKDOWN:
{
  "plan": [
    {
      "day": 1,
      "date": "MMM DD", 
      "events": [
         {
           "type": "activity" | "travel" | "meal" | "sleep" | "wait",
           "name": "string",
           "activityId": "string (only for type=activity, use EXACT id from input)",
           "startTime": "HH:MM AM/PM",
           "endTime": "HH:MM AM/PM",
           "duration": number (in hours),
           "locationName": "string",
           "distance": "string (e.g. 50 km)",
           "location": { "lat": number, "lng": number }, (only for activities)
           "hotelName": "string", (only for type=sleep, recommend a real hotel matching travelStyle and location)
           "mealPlan": "string", (only for type=sleep, recommend 'BB' | 'HB' | 'FB' | 'AI')
           "rateUsd": number (only for type=sleep, recommend room night rate in USD as a number)
         }
      ],
      "utilization": 0.8,
      "weather": "Sunny 29°C",
      "recommendation": "Brief positive summary of this day",
      "district": "Main district name"
    }
  ],
  "droppedActivities": [
      // Only include activities here if you absolutely cannot fit them into the schedule.
      // Use the exact ID of the activity from the user input.
  ]
}
`;


        const userPrompt = `
Duration: ${durationDays} Days
Travel Style: ${travelStyle || 'Luxury'}

Selected Activities:
${JSON.stringify(activities.map(a => ({ id: a.id, name: a.activity_name, lat: a.lat, lng: a.lng, district: a.district, duration_hours: a.duration_hours, optimal_start_time: a.optimal_start_time })), null, 2)}
    `;

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = systemPrompt + "\n\n" + userPrompt;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2
                }
            });

            const responseText = result.response.text() || '{}';
            const aiResult = JSON.parse(responseText);

            const plan: ItineraryDay[] = aiResult.plan || [];
            const droppedIds: any[] = aiResult.droppedActivities || [];

            // Re-hydrate full dropped activities objects
            const droppedActivities = activities.filter(a => droppedIds.includes(a.id) || droppedIds.includes(String(a.id)));

            // Calculate simple metrics since this is an AI route
            let totalDistance = 0;
            let totalTravelTime = 0;

            plan.forEach(day => {
                day.events.forEach(e => {
                    if (e.type === 'travel' && e.distance) {
                        const distVal = parseInt(e.distance.replace(/[^0-9]/g, ''));
                        if (!isNaN(distVal)) {
                            totalDistance += distVal;
                            totalTravelTime += (distVal / 35); // 35 km/h avg speed
                        }
                    }
                });
            });

            return {
                plan,
                totalDays: durationDays,
                totalDistance: Math.round(totalDistance),
                totalTravelTime: Math.round(totalTravelTime * 60), // in mins
                totalCost: 0,
                optimizationScore: 98, // High score since AI optimizes logically
                feasible: true,
                conflicts: [],
                droppedActivities: droppedActivities.length > 0 ? droppedActivities : undefined
            };

        } catch (error) {
            console.error("AI Route Generation Error:", error);
            throw new Error("Failed to generate intelligent route via AI Engine.");
        }
    }
}

export async function generateAIRoutePlan(
    activities: Activity[],
    locations: GeoLocation[],
    durationDays = 5,
    customRules?: string,
    travelStyle?: string
): Promise<RoutePlan> {
    const engine = new AdvancedAiRouteEngine();
    return engine.generatePlan(activities, locations, durationDays, customRules, travelStyle);
}

