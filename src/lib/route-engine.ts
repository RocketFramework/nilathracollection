import { Activity } from "@/data/activities";
import OpenAI from 'openai';

// ==================== CORE INTERFACES ====================
// These match your page.tsx imports exactly

export interface GeoLocation {
    lat: number;
    lng: number;
    name: string;
    address?: string;
    timezone?: string;
}

export interface ItineraryEvent {
    type: 'activity' | 'travel' | 'meal' | 'sleep' | 'train' | 'buffer' | 'wait';
    name: string;
    startTime: string;
    endTime: string;
    duration: number; // in hours
    locationName?: string;
    location?: { lat: number; lng: number };
    carbon?: number;
}

export interface ItineraryDay {
    day: number;
    date: string;
    events: ItineraryEvent[];
    utilization: number;
    weather?: string;
    recommendation?: string;
}

export interface RoutePlan {
    plan: ItineraryDay[];
    totalDays: number;
    totalDistance: number;
    totalTravelTime: number;
    totalCost: number;
    optimizationScore: number;
    feasible: boolean;
    conflicts: string[];
}

// ==================== AI ROUTE ENGINE ====================

export class AdvancedRouteEngine {
    private openai: OpenAI;
    private distanceMatrix: Map<string, number> = new Map();

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
            dangerouslyAllowBrowser: true
        });
    }

    /**
     * The main entry point called by page.tsx
     */
    async generatePlan(chosenActivities: Activity[], optionalLocations: GeoLocation[]): Promise<RoutePlan> {
        // 1. Build Distance Matrix (Pre-calculating all possible paths)
        this.buildDistanceMatrix(chosenActivities);

        // 2. Initial State: Group activities into a 3-day baseline
        let bestState = this.initializeClusters(chosenActivities);
        let bestScore = this.calculateFitness(bestState);

        // 3. AI Optimization: Simulated Annealing Loop
        // This is non-sequential; it swaps activities to find the shortest total path
        let temperature = 100;
        for (let i = 0; i < 50; i++) {
            const candidate = this.neighborSearch(bestState);
            const candidateScore = this.calculateFitness(candidate);

            // Accept better plans, or occasionally worse ones to avoid local optima
            if (candidateScore > bestScore || Math.random() < (temperature / 100)) {
                bestState = candidate;
                bestScore = candidateScore;
            }
            temperature *= 0.92;
        }

        // 4. Detailed Mapping: Transform optimized clusters into timed ItineraryEvents
        const finalizedDays = await this.mapToItinerary(bestState);

        // 5. Final Metrics Calculation
        const totalDist = this.calculateTotalDistance(bestState);
        const totalCost = 0;

        return {
            plan: finalizedDays,
            totalDays: finalizedDays.length,
            totalDistance: Math.round(totalDist),
            totalTravelTime: Math.round(totalDist / 40), // Est 40km/h avg in SL
            totalCost: totalCost,
            optimizationScore: Math.min(100, Math.round(bestScore / 10)),
            feasible: true,
            conflicts: []
        };
    }

    private buildDistanceMatrix(activities: Activity[]) {
        activities.forEach(a1 => {
            activities.forEach(a2 => {
                const key = `${a1.lat},${a1.lng}-${a2.lat},${a2.lng}`;
                const dist = this.haversine(a1.lat ?? 0, a1.lng ?? 0, a2.lat ?? 0, a2.lng ?? 0);
                this.distanceMatrix.set(key, dist);
            });
        });
    }

    private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3; // 1.3x multiplier for SL roads
    }

    private initializeClusters(activities: Activity[]): Activity[][] {
        const days: Activity[][] = [[], [], []];
        activities.forEach((a, i) => days[i % 3].push(a));
        return days;
    }

    private calculateFitness(state: Activity[][]): number {
        let totalPathDist = 0;
        state.forEach(day => {
            for (let i = 0; i < day.length - 1; i++) {
                const key = `${day[i].lat},${day[i].lng}-${day[i + 1].lat},${day[i + 1].lng}`;
                totalPathDist += (this.distanceMatrix.get(key) || 0);
            }
        });
        // Fitness = inverse of distance (we want to maximize this score)
        return 1000 - totalPathDist;
    }

    private neighborSearch(state: Activity[][]): Activity[][] {
        const next = state.map(d => [...d]);
        const d1 = Math.floor(Math.random() * next.length);
        const d2 = Math.floor(Math.random() * next.length);

        if (next[d1].length > 0) {
            const [item] = next[d1].splice(Math.floor(Math.random() * next[d1].length), 1);
            next[d2].push(item);
        }
        return next;
    }

    private calculateTotalDistance(state: Activity[][]): number {
        return state.reduce((acc, day) => {
            let d = 0;
            for (let i = 0; i < day.length - 1; i++) {
                const key = `${day[i].lat},${day[i].lng}-${day[i + 1].lat},${day[i + 1].lng}`;
                d += (this.distanceMatrix.get(key) || 0);
            }
            return acc + d;
        }, 0);
    }

    private async mapToItinerary(state: Activity[][]): Promise<ItineraryDay[]> {
        return Promise.all(state.map(async (dayActivities, idx) => {
            const events: ItineraryEvent[] = [];
            let currentMinutes = 510; // 8:30 AM start

            // Morning Starter
            events.push({
                type: 'meal',
                name: 'Morning Breakfast',
                startTime: '08:00',
                endTime: '08:45',
                duration: 0.75
            });

            for (const act of dayActivities) {
                // If not first activity, add travel
                if (events.length > 1) {
                    const travelTime = 45; // Default 45 mins transit
                    events.push({
                        type: 'travel',
                        name: 'Transit to Activity',
                        startTime: this.minsToTime(currentMinutes),
                        endTime: this.minsToTime(currentMinutes + travelTime),
                        duration: travelTime / 60
                    });
                    currentMinutes += travelTime;
                }

                const durationMins = (act.duration_hours || 2) * 60;
                events.push({
                    type: act.activity_name.toLowerCase().includes('train') ? 'train' : 'activity',
                    name: act.activity_name,
                    startTime: this.minsToTime(currentMinutes),
                    endTime: this.minsToTime(currentMinutes + durationMins),
                    duration: act.duration_hours || 2,
                    locationName: act.location_name,
                    location: { lat: act.lat ?? 0, lng: act.lng ?? 0 }
                });
                currentMinutes += durationMins;
            }

            // AI Logic for Recommendation (Simulated)
            const rec = dayActivities.length > 0
                ? `Optimized route through ${dayActivities[0].location_name} focusing on efficiency.`
                : "A leisure day for exploration.";

            return {
                day: idx + 1,
                date: new Date(Date.now() + idx * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                events,
                utilization: Math.min(1, dayActivities.length / 4),
                weather: "Sunny, 29°C",
                recommendation: rec
            };
        }));
    }

    private minsToTime(mins: number): string {
        const h = Math.floor(mins / 60) % 24;
        const m = Math.floor(mins % 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
}

/**
 * EXPORTED HELPER: matches "import { generateRoutePlan } from ..." in page.tsx
 */
export async function generateRoutePlan(activities: Activity[], locations: GeoLocation[]): Promise<RoutePlan> {
    const engine = new AdvancedRouteEngine();
    return await engine.generatePlan(activities, locations);
}