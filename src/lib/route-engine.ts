import { Activity } from "@/data/activities";

export interface Location {
    lat: number;
    lng: number;
    name: string;
}

export interface ItineraryEvent {
    type: 'activity' | 'travel' | 'meal' | 'sleep';
    name: string;
    startTime: string;
    endTime: string;
    duration: number;
    activityId?: number;
    locationName?: string;
}

export interface ItineraryDay {
    day: number;
    events: ItineraryEvent[];
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 50;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function generateRoutePlan(
    chosenActivities: Activity[],
    selectedOptionalLocationsList: Location[]
): { plan: ItineraryDay[], totalDays: number } {
    let plan: ItineraryDay[] = [];
    let currentDay = 1;
    let currentTime = 8;
    let currentDayEvents: ItineraryEvent[] = [];

    const formatTime = (timeNum: number) => {
        const h = Math.floor(timeNum) % 24;
        const m = Math.round((timeNum - Math.floor(timeNum)) * 60);
        const ampm = Math.floor(timeNum) >= 12 && Math.floor(timeNum) < 24 ? 'PM' : 'AM';
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const advanceTime = (hours: number, eventDetails: Partial<ItineraryEvent>) => {
        if (currentTime >= 20 && eventDetails.type !== 'meal' && eventDetails.type !== 'sleep') {
            currentDayEvents.push({
                type: 'meal', name: 'Dinner & Leisure', startTime: formatTime(20), endTime: formatTime(22), duration: 2
            });
            plan.push({ day: currentDay, events: currentDayEvents });
            currentDay++;
            currentDayEvents = [];
            currentTime = 8;
            currentDayEvents.push({
                type: 'meal', name: 'Breakfast', startTime: formatTime(8), endTime: formatTime(9), duration: 1
            });
            currentTime = 9;
        }
        const st = currentTime;
        currentTime += hours;
        const et = currentTime;
        currentDayEvents.push({
            type: eventDetails.type || 'activity',
            name: eventDetails.name || 'Activity',
            startTime: formatTime(st),
            endTime: formatTime(et),
            duration: hours,
            ...eventDetails
        } as ItineraryEvent);
    };

    currentTime = 8;
    advanceTime(1, { type: 'meal', name: 'Breakfast' });

    const COLOMBO_LAT = 6.9271;
    const COLOMBO_LNG = 79.8612;

    let currentLocation = { lat: COLOMBO_LAT, lng: COLOMBO_LNG };

    let remainingActivities = [...chosenActivities];

    // Greedy routing for selected activities
    while (remainingActivities.length > 0) {
        let closestIdx = 0;
        let minAvgDist = Infinity;

        for (let i = 0; i < remainingActivities.length; i++) {
            const act = remainingActivities[i];
            if (act.lat && act.lng) {
                const dist = getDistance(currentLocation.lat, currentLocation.lng, act.lat, act.lng);
                if (dist < minAvgDist) {
                    minAvgDist = dist;
                    closestIdx = i;
                }
            } else if (minAvgDist === Infinity) {
                closestIdx = i;
            }
        }

        const nextAct = remainingActivities.splice(closestIdx, 1)[0];

        if (nextAct.lat && nextAct.lng) {
            const dist = getDistance(currentLocation.lat, currentLocation.lng, nextAct.lat, nextAct.lng);
            if (dist > 20) {
                const travelTime = dist / 50; // Assume 50km/hr average speed
                advanceTime(travelTime, { type: 'travel', name: `Travel to ${nextAct.location_name || 'Next Destination'}` });
                currentLocation = { lat: nextAct.lat, lng: nextAct.lng };
            }
        }
        advanceTime(nextAct.duration_hours, {
            type: 'activity',
            name: nextAct.activity_name,
            activityId: nextAct.id,
            locationName: nextAct.location_name || undefined
        });

        if (currentTime >= 13 && currentTime < 15) {
            advanceTime(1, { type: 'meal', name: 'Lunch Break' });
        }
    }

    // Greedy routing for optional locations
    let remainingOptional = [...selectedOptionalLocationsList];

    while (remainingOptional.length > 0) {
        let closestIdx = 0;
        let minAvgDist = Infinity;

        for (let i = 0; i < remainingOptional.length; i++) {
            const loc = remainingOptional[i];
            const dist = getDistance(currentLocation.lat, currentLocation.lng, loc.lat, loc.lng);
            if (dist < minAvgDist) {
                minAvgDist = dist;
                closestIdx = i;
            }
        }

        const loc = remainingOptional.splice(closestIdx, 1)[0];

        const dist = getDistance(currentLocation.lat, currentLocation.lng, loc.lat, loc.lng);
        if (dist > 20) {
            const travelTime = dist / 50;
            advanceTime(travelTime, { type: 'travel', name: `Travel to ${loc.name}` });
            currentLocation = { lat: loc.lat, lng: loc.lng };
        }
        advanceTime(3, { type: 'activity', name: `Explore ${loc.name}`, locationName: loc.name });
    }

    // Return to Colombo logic
    const distToColombo = getDistance(currentLocation.lat, currentLocation.lng, COLOMBO_LAT, COLOMBO_LNG);
    if (distToColombo > 20) {
        const travelTime = distToColombo / 50;
        advanceTime(travelTime, { type: 'travel', name: `Travel back to Colombo` });
        currentLocation = { lat: COLOMBO_LAT, lng: COLOMBO_LNG };
    }

    if (currentTime < 20) {
        currentTime = 20;
    }
    advanceTime(2, { type: 'meal', name: 'Dinner & Leisure' });
    plan.push({ day: currentDay, events: currentDayEvents });

    return {
        plan,
        totalDays: currentDay
    };
}
