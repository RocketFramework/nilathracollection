import { Activity } from "@/data/activities";
import OpenAI from 'openai';

// ==================== INTERFACES ====================

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
  duration: number;
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
  district?: string;
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
  droppedActivities?: Activity[];
}

// ==================== CONSTANTS ====================

const CONSTANTS = {
  AIRPORT: { lat: 7.1725, lng: 79.8853, name: 'Katunayake Airport' } as GeoLocation,
  COLOMBO: { lat: 6.9271, lng: 79.8612, name: 'Colombo' } as GeoLocation,
  AVG_SPEED: 35,
  ROAD_FACTOR: 1.3,

  DAY_START: 480,   // 08:00
  DAY_END: 1200,    // 20:00

  MAX_ACTIVITIES_PER_DAY: 5,

  MEAL_TIMES: {
    breakfast: { duration: 45 },
    lunch:     { duration: 60 },
    dinner:    { duration: 60 }
  },

  TRANSIT: {
    hotelTransfer: 30,
    buffer: 15
  }
} as const;

// ==================== TYPE HELPERS ====================

type Locatable<T = Activity> = T & { lat: number; lng: number };

function hasLocation(item: Activity | GeoLocation): item is Locatable {
  return item.lat !== null && item.lng !== null;
}

function getSafeLocation(item: Activity | GeoLocation, fallback: GeoLocation = CONSTANTS.COLOMBO): GeoLocation {
  if (hasLocation(item)) {
    return { lat: item.lat, lng: item.lng, name: 'item' in item ? (item as Activity).location_name || 'Place' : item.location_name };
  }
  return fallback;
}

// ==================== ENGINE ====================

export class AdvancedRouteEngine {
  private openai: OpenAI;
  private distanceCache: Map<string, number> = new Map();
  private startLocation: GeoLocation;
  private droppedActivities: Activity[] = [];

  constructor(start: GeoLocation = CONSTANTS.AIRPORT) {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
    this.startLocation = start;
  }

  async generatePlan(
    activities: Activity[],
    _optionalLocations: GeoLocation[], // unused in current logic
    durationDays: number
  ): Promise<RoutePlan> {
    this.droppedActivities = [];

    if (activities.length === 0) {
      return this.createEmptyPlan(durationDays);
    }

    this.buildDistanceMatrix(activities);

    const clustered = this.intelligentClustering(activities, durationDays);
    const ordered = this.orderDaysGeographically(clustered);

    const planDays = await this.generateDayItineraries(ordered);
    const metrics = this.calculateMetrics(ordered);

    return {
      plan: planDays,
      totalDays: planDays.length,
      totalDistance: metrics.totalDistance,
      totalTravelTime: metrics.totalTravelTime,
      totalCost: 0,
      optimizationScore: metrics.optimizationScore,
      feasible: true,
      conflicts: [],
      droppedActivities: this.droppedActivities.length ? this.droppedActivities : undefined
    };
  }

  // ────────────────────────────────────────────────
  // Distance helpers
  // ────────────────────────────────────────────────

  private getDistanceKey(a: GeoLocation, b: GeoLocation): string {
    return `${a.lat.toFixed(5)},${a.lng.toFixed(5)}→${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
  }

  private calculateRoadDistance(lat1: number|0, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * CONSTANTS.ROAD_FACTOR;
  }

  private estimateTravelMinutes(a: Activity | GeoLocation, b: Activity | GeoLocation): number {
    if (!hasLocation(a) || !hasLocation(b)) return 30;
    const km = this.calculateRoadDistance(a.lat, a.lng, b.lat, b.lng);
    return Math.max(30, Math.round(km / CONSTANTS.AVG_SPEED * 60));
  }

  private buildDistanceMatrix(activities: Activity[]) {
    const locations: GeoLocation[] = [
      this.startLocation,
      ...activities.filter(hasLocation).map(a => ({
        lat: a.lat,
        lng: a.lng,
        name: a.location_name || 'Activity'
      }))
    ];

    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const dist = this.calculateRoadDistance(
          locations[i].lat,
          locations[i].lng,
          locations[j].lat,
          locations[j].lng
        );
        this.distanceCache.set(this.getDistanceKey(locations[i], locations[j]), dist);
      }
    }
  }

  // ────────────────────────────────────────────────
  // Clustering & sequencing
  // ────────────────────────────────────────────────

  private intelligentClustering(acts: Activity[], daysCount: number): Activity[][] {
    const days: Activity[][] = Array.from({ length: daysCount }, () => []);

    const sorted = [...acts].sort((a, b) => {
      const scoreA = (a.optimal_start_time ? 5 : 0) + (a.duration_hours || 2);
      const scoreB = (b.optimal_start_time ? 5 : 0) + (b.duration_hours || 2);
      return scoreB - scoreA;
    });

    const centers = this.getDistrictCenters(acts, daysCount);

    const leftovers: Activity[] = [];

    for (const activity of sorted) {
      if (!hasLocation(activity)) {
        leftovers.push(activity);
        continue;
      }

      let bestDayIdx = -1;
      let bestDist = Infinity;

      centers.forEach((center, idx) => {
        if (days[idx].length >= CONSTANTS.MAX_ACTIVITIES_PER_DAY) return;
        const dist = this.calculateRoadDistance(activity.lat, activity.lng, center.lat, center.lng);
        const score = dist * (center.district === activity.district ? 0.6 : 1.0);
        if (score < bestDist) {
          bestDist = score;
          bestDayIdx = idx;
        }
      });

      if (bestDayIdx >= 0) {
        days[bestDayIdx].push(activity);
      } else {
        leftovers.push(activity);
      }
    }

    // Fill remaining spots
    for (const leftover of leftovers) {
      let chosenDay = -1;
      let lowestLoad = Infinity;

      days.forEach((day, idx) => {
        if (day.length >= CONSTANTS.MAX_ACTIVITIES_PER_DAY) return;
        const load = day.reduce((sum, a) => sum + (a.duration_hours || 2), 0);
        if (load < lowestLoad) {
          lowestLoad = load;
          chosenDay = idx;
        }
      });

      if (chosenDay >= 0) {
        days[chosenDay].push(leftover);
      } else {
        this.droppedActivities.push(leftover);
      }
    }

    return days.map(day => this.optimizeDayOrder(day));
  }

  private getDistrictCenters(activities: Activity[], needed: number): { lat: number; lng: number; district: string }[] {
    const districtGroups = new Map<string, Locatable<Activity>[]>();

    activities.forEach(a => {
      if (hasLocation(a) && a.district) {
        if (!districtGroups.has(a.district)) districtGroups.set(a.district, []);
        districtGroups.get(a.district)!.push(a);
      }
    });

    const centers: { lat: number; lng: number; district: string }[] = [];

    districtGroups.forEach((group, district) => {
      if (centers.length >= needed) return;
      const sumLat = group.reduce((s, a) => s + a.lat, 0);
      const sumLng = group.reduce((s, a) => s + a.lng, 0);
      centers.push({
        lat: sumLat / group.length,
        lng: sumLng / group.length,
        district
      });
    });

    while (centers.length < needed) {
      centers.push({ ...CONSTANTS.COLOMBO, district: 'Colombo' });
    }

    return centers;
  }

  private optimizeDayOrder(activities: Activity[]): Activity[] {
    const timed = activities.filter(a => !!a.optimal_start_time);
    const flexible = activities.filter(a => !a.optimal_start_time);

    timed.sort((a, b) => this.getMinutes(a.optimal_start_time!) - this.getMinutes(b.optimal_start_time!));

    const path = this.nearestNeighborPath(flexible);

    const beforeLunch = timed.filter(t => this.getMinutes(t.optimal_start_time!) < 720);
    const afterLunch = timed.filter(t => this.getMinutes(t.optimal_start_time!) >= 720);

    return [...beforeLunch, ...path, ...afterLunch];
  }

  private nearestNeighborPath(items: Activity[]): Activity[] {
    const locatable = items.filter(hasLocation) as Locatable<Activity>[];
    if (locatable.length <= 1) return items;

    const path: Locatable<Activity>[] = [];
    const queue = [...locatable];

    let current = queue.shift()!;
    path.push(current);

    while (queue.length > 0) {
      let closestIdx = 0;
      let minDist = Infinity;

      queue.forEach((candidate, idx) => {
        const dist = this.calculateRoadDistance(
          current.lat, current.lng,
          candidate.lat, candidate.lng
        );
        if (dist < minDist) {
          minDist = dist;
          closestIdx = idx;
        }
      });

      current = queue.splice(closestIdx, 1)[0];
      path.push(current);
    }

    return path;
  }

  private getMinutes(timeStr: string): number {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 9999;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (match[3]?.toUpperCase() === 'PM' && h < 12) h += 12;
    return h * 60 + m;
  }

  private orderDaysGeographically(days: Activity[][]): Activity[][] {
    if (days.length <= 1) return days;

    const dayCenters = days.map(day => {
      const locs = day.filter(hasLocation) as Locatable<Activity>[];
      if (locs.length === 0) return CONSTANTS.COLOMBO;
      const lat = locs.reduce((s, a) => s + a.lat, 0) / locs.length;
      const lng = locs.reduce((s, a) => s + a.lng, 0) / locs.length;
      return { lat, lng, name: 'Day center' } as GeoLocation;
    });

    const path: Activity[][] = [];
    const remaining = [...days];
    let current = this.startLocation;

    while (remaining.length > 0) {
      let closestIdx = 0;
      let minDist = Infinity;

      remaining.forEach((day, idx) => {
        const center = dayCenters[days.indexOf(day)];
        const dist = this.calculateRoadDistance(current.lat, current.lng, center.lat, center.lng);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = idx;
        }
      });

      path.push(remaining.splice(closestIdx, 1)[0]);
      current = dayCenters[days.indexOf(path[path.length - 1])];
    }

    return path;
  }

  // ────────────────────────────────────────────────
  // Day building
  // ────────────────────────────────────────────────

  private async generateDayItineraries(clusters: Activity[][]): Promise<ItineraryDay[]> {
    const result: ItineraryDay[] = [];

    for (let dayNumber = 0; dayNumber < clusters.length; dayNumber++) {
      const dayActs = clusters[dayNumber];
      if (dayActs.length === 0) {
        result.push(this.createEmptyDay(dayNumber));
        continue;
      }

      const events = this.buildDaySchedule(dayActs, dayNumber, clusters);

      const districts = dayActs.map(a => a.district).filter((d): d is string => !!d);
      const topDistrict = districts.length > 0
        ? districts.sort((a,b) => districts.filter(v => v === a).length - districts.filter(v => v === b).length)[0]
        : undefined;

      result.push({
        day: dayNumber + 1,
        date: this.formatDate(new Date(Date.now() + dayNumber * 86400000)),
        events,
        utilization: this.calculateUtilization(events),
        weather: this.randomWeather(),
        recommendation: await this.generateRecommendation(dayActs),
        district: topDistrict
      });
    }

    return result;
  }

  private buildDaySchedule(activities: Activity[], dayIndex: number, clusters: Activity[][]): ItineraryEvent[] {
    const events: ItineraryEvent[] = [];
    let currentMinutes = CONSTANTS.DAY_START;
    let currentPos = this.getStartLocation(dayIndex, clusters);

    // Breakfast
    events.push({
      type: 'meal',
      name: 'Breakfast',
      startTime: this.minutesToTime(currentMinutes),
      endTime: this.minutesToTime(currentMinutes + CONSTANTS.MEAL_TIMES.breakfast.duration),
      duration: CONSTANTS.MEAL_TIMES.breakfast.duration / 60,
      locationName: currentPos.name
    });
    currentMinutes += CONSTANTS.MEAL_TIMES.breakfast.duration;

    let lunchTaken = false;

    // Travel to first activity if needed
    if (activities.length > 0) {
      const firstAct = activities[0];
      if (hasLocation(firstAct)) {
        const travelTime = this.estimateTravelMinutes(currentPos, firstAct);
        if (currentMinutes + travelTime < CONSTANTS.DAY_END - 180) {
          events.push({
            type: 'travel',
            name: `Travel to ${firstAct.location_name}`,
            startTime: this.minutesToTime(currentMinutes),
            endTime: this.minutesToTime(currentMinutes + travelTime),
            duration: travelTime / 60,
            locationName: `${Math.round(this.calculateRoadDistance(currentPos.lat, currentPos.lng, firstAct.lat, firstAct.lng))} km`
          });
          currentMinutes += travelTime;
          currentPos = getSafeLocation(firstAct);
        }
      }
    }

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const actDuration = Math.round((activity.duration_hours || 2) * 60);

      if (currentMinutes + actDuration + 90 > CONSTANTS.DAY_END) {
        this.droppedActivities.push(activity);
        continue;
      }

      // Inter-activity travel
      if (i > 0) {
        const prev = activities[i - 1];
        if (hasLocation(prev) && hasLocation(activity)) {
          const travelMin = this.estimateTravelMinutes(prev, activity);
          events.push({
            type: 'travel',
            name: `Travel to ${activity.location_name}`,
            startTime: this.minutesToTime(currentMinutes),
            endTime: this.minutesToTime(currentMinutes + travelMin),
            duration: travelMin / 60,
            locationName: `${Math.round(this.calculateRoadDistance(prev.lat, prev.lng, activity.lat, activity.lng))} km`
          });
          currentMinutes += travelMin;
        }
      }

      // Lunch window
      if (!lunchTaken && currentMinutes >= 660 && currentMinutes <= 840) {
        let lunchStart = Math.max(currentMinutes, 720);
        if (lunchStart + 60 <= CONSTANTS.DAY_END - 90) {
          if (lunchStart > currentMinutes) {
            events.push({
              type: 'wait',
              name: 'Free time',
              startTime: this.minutesToTime(currentMinutes),
              endTime: this.minutesToTime(lunchStart),
              duration: (lunchStart - currentMinutes) / 60
            });
          }
          events.push({
            type: 'meal',
            name: 'Lunch',
            startTime: this.minutesToTime(lunchStart),
            endTime: this.minutesToTime(lunchStart + 60),
            duration: 1,
            locationName: currentPos.name
          });
          currentMinutes = lunchStart + 60;
          lunchTaken = true;
        }
      }

      // Main activity
      events.push({
        type: 'activity',
        name: activity.activity_name,
        startTime: this.minutesToTime(currentMinutes),
        endTime: this.minutesToTime(currentMinutes + actDuration),
        duration: actDuration / 60,
        locationName: activity.location_name,
        location: hasLocation(activity) ? { lat: activity.lat, lng: activity.lng } : undefined
      });

      currentMinutes += actDuration;

      if (hasLocation(activity)) {
        currentPos = getSafeLocation(activity);
      }

      // Buffer between activities
      if (i < activities.length - 1) {
        currentMinutes += CONSTANTS.TRANSIT.buffer;
      }
    }

    this.closeDay(events, currentMinutes, currentPos);

    return events;
  }

  private closeDay(events: ItineraryEvent[], currentTime: number, pos: GeoLocation) {
    let t = currentTime;

    // Hotel transfer
    if (t < CONSTANTS.DAY_END - 90) {
      const transfer = CONSTANTS.TRANSIT.hotelTransfer;
      events.push({
        type: 'travel',
        name: 'To hotel',
        startTime: this.minutesToTime(t),
        endTime: this.minutesToTime(t + transfer),
        duration: transfer / 60
      });
      t += transfer;
    }

    // Dinner
    let dinnerTime = Math.max(t, 1080);
    if (dinnerTime + 60 <= CONSTANTS.DAY_END) {
      if (dinnerTime > t) {
        events.push({
          type: 'wait',
          name: 'Evening free',
          startTime: this.minutesToTime(t),
          endTime: this.minutesToTime(dinnerTime),
          duration: (dinnerTime - t) / 60
        });
      }
      events.push({
        type: 'meal',
        name: 'Dinner',
        startTime: this.minutesToTime(dinnerTime),
        endTime: this.minutesToTime(dinnerTime + 60),
        duration: 1,
        locationName: 'Hotel / Restaurant'
      });
      t = dinnerTime + 60;
    }

    // Sleep
    events.push({
      type: 'sleep',
      name: 'Overnight',
      startTime: this.minutesToTime(t),
      endTime: '8:00 AM',
      duration: (24 * 60 - t + CONSTANTS.DAY_START) / 60
    });
  }

  private getStartLocation(dayIndex: number, clusters: Activity[][]): GeoLocation {
    if (dayIndex === 0) return this.startLocation;
    const prev = clusters[dayIndex - 1];
    if (!prev?.length) return this.startLocation;
    return getSafeLocation(prev[prev.length - 1], this.startLocation);
  }

  private minutesToTime(minutes: number): string {
    const totalHours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    const period = totalHours >= 12 ? 'PM' : 'AM';
    const displayHour = totalHours % 12 || 12;
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private randomWeather(): string {
    const options = ['Sunny 29°C', 'Partly cloudy 27°C', 'Clear 28°C', 'Light breeze 26°C'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private async generateRecommendation(activities: Activity[]): Promise<string> {
    if (activities.length === 0) return "A calm day with no planned activities.";
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a warm, enthusiastic travel guide. Write one lively sentence summarizing the day." },
          { role: "user", content: activities.map(a => `- ${a.activity_name} in ${a.location_name}`).join("\n") }
        ],
        max_tokens: 80
      });
      return response.choices[0]?.message?.content?.trim() || "Wonderful day of discovery!";
    } catch {
      return "Enjoy exploring beautiful locations today!";
    }
  }

  private calculateUtilization(events: ItineraryEvent[]): number {
    const activeHours = events
      .filter(e => e.type !== 'sleep')
      .reduce((sum, e) => sum + e.duration, 0);
    return Math.min(1, activeHours / 12);
  }

  private calculateMetrics(days: Activity[][]) {
    let totalKm = 0;
    let totalTravel = 0;
    let scoreTotal = 0;

    days.forEach(day => {
      let dayKm = 0;
      for (let i = 0; i < day.length - 1; i++) {
        if (hasLocation(day[i]) && hasLocation(day[i + 1])) {
          dayKm += this.calculateRoadDistance(day[i].lat??0 , day[i].lng??0, day[i + 1].lat??0, day[i + 1].lng??0);
        }
      }
      totalKm += dayKm;
      totalTravel += dayKm / CONSTANTS.AVG_SPEED * 60;

      const actCount = day.length;
      const uniqueDistricts = new Set(day.map(a => a.district).filter(Boolean)).size;
      let dayScore = 100;
      if (actCount > 5) dayScore -= (actCount - 5) * 15;
      if (dayKm > 100) dayScore -= Math.round((dayKm - 100) * 0.5);
      if (uniqueDistricts > 2) dayScore -= (uniqueDistricts - 2) * 10;
      scoreTotal += Math.max(0, Math.min(100, dayScore));
    });

    return {
      totalDistance: Math.round(totalKm),
      totalTravelTime: Math.round(totalTravel),
      optimizationScore: days.length ? Math.round(scoreTotal / days.length) : 0
    };
  }

  private createEmptyPlan(dayCount: number): RoutePlan {
    return {
      plan: Array.from({ length: dayCount }, (_, i) => this.createEmptyDay(i)),
      totalDays: dayCount,
      totalDistance: 0,
      totalTravelTime: 0,
      totalCost: 0,
      optimizationScore: 0,
      feasible: true,
      conflicts: []
    };
  }

  private createEmptyDay(index: number): ItineraryDay {
    return {
      day: index + 1,
      date: this.formatDate(new Date(Date.now() + index * 86400000)),
      events: [{
        type: 'buffer',
        name: 'No activities scheduled',
        startTime: '8:00 AM',
        endTime: '8:00 PM',
        duration: 12
      }],
      utilization: 0
    };
  }
}

export async function generateRoutePlan(
  activities: Activity[],
  locations: GeoLocation[],
  durationDays = 5
): Promise<RoutePlan> {
  const engine = new AdvancedRouteEngine();
  return engine.generatePlan(activities, locations, durationDays);
}