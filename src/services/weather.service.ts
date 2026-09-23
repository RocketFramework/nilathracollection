import { InternalItineraryBlock, WeatherReportData, WeatherReportItem } from '../other/interfaces';

interface SeasonData {
  swimming: number;
  activity: number;
  weather: number;
  concern: 'Low' | 'Moderate' | 'Moderate-high' | 'High';
  advice: string;
}

interface CityWeatherConfig {
  displayName: string;
  category: 'seaside' | 'inland';
  aliases: string[];
  seasons: {
    swMonsoon: SeasonData;     // May - Sep (Month 4 to 8)
    interMonsoon: SeasonData;  // Oct - Nov (Month 9 to 10)
    neMonsoon: SeasonData;     // Dec - Apr (Month 11, 0 to 3)
  };
}

const CITY_CONFIGS: CityWeatherConfig[] = [
  {
    displayName: 'Nilaveli / Pigeon Island',
    category: 'seaside',
    aliases: ['nilaveli', 'pigeon island', 'trincomalee', 'uppuveli'],
    seasons: {
      swMonsoon: { swimming: 4.5, activity: 5.0, weather: 4.5, concern: 'Low', advice: 'Pristine calm sea; optimal window for swimming & snorkelling' },
      interMonsoon: { swimming: 4.5, activity: 5.0, weather: 3.0, concern: 'Moderate', advice: 'Very good if conditions cooperate' },
      neMonsoon: { swimming: 2.5, activity: 2.5, weather: 2.5, concern: 'High', advice: 'For the travel period sea is bit rough; boat transfers restricted' }
    }
  },
  {
    displayName: 'Pasikuda / Kalkudah',
    category: 'seaside',
    aliases: ['pasikuda', 'pasikudah', 'kalkudah', 'batticaloa'],
    seasons: {
      swMonsoon: { swimming: 5.0, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Excellent shallow waters for swimming & relaxation' },
      interMonsoon: { swimming: 5.0, activity: 4.0, weather: 3.5, concern: 'Moderate', advice: 'Very good for shallow swimming' },
      neMonsoon: { swimming: 3.0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'For the travel period sea is bit rough due to NE monsoon swells' }
    }
  },
  {
    displayName: 'Unawatuna / Galle',
    category: 'seaside',
    aliases: ['unawatuna', 'galle', 'thalpe', 'koggala', 'habaraduwa'],
    seasons: {
      swMonsoon: { swimming: 3.0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'For the travel period sea is bit rough; protected bay allows limited swimming' },
      interMonsoon: { swimming: 4.0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'Good fallback' },
      neMonsoon: { swimming: 5.0, activity: 4.5, weather: 5.0, concern: 'Low', advice: 'Pristine calm waters; excellent for swimming & ocean activities' }
    }
  },
  {
    displayName: 'Hikkaduwa',
    category: 'seaside',
    aliases: ['hikkaduwa', 'dodanduwa', 'ambalangoda'],
    seasons: {
      swMonsoon: { swimming: 2.5, activity: 3.5, weather: 3.0, concern: 'High', advice: 'For the travel period sea is bit rough; beach swimming restricted' },
      interMonsoon: { swimming: 3.5, activity: 4.0, weather: 3.0, concern: 'Moderate-high', advice: 'For the travel period sea is bit rough; good fallback for snorkelling' },
      neMonsoon: { swimming: 4.5, activity: 5.0, weather: 4.5, concern: 'Low', advice: 'Pristine coral reef snorkelling & clear calm sea' }
    }
  },
  {
    displayName: 'Mirissa / Weligama',
    category: 'seaside',
    aliases: ['mirissa', 'weligama', 'matara', 'midigama', 'ahangama'],
    seasons: {
      swMonsoon: { swimming: 2.5, activity: 2.5, weather: 3.0, concern: 'High', advice: 'For the travel period sea is bit rough; ocean swells active' },
      interMonsoon: { swimming: 3.0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'For the travel period sea is bit rough; less suitable for your priorities' },
      neMonsoon: { swimming: 4.5, activity: 5.0, weather: 5.0, concern: 'Low', advice: 'Peak season for whale watching & beach relaxation' }
    }
  },
  {
    displayName: 'Bentota / Beruwala',
    category: 'seaside',
    aliases: ['bentota', 'beruwala', 'wadduwa', 'induruwa', 'kalutara', 'kosgoda', 'ahungalla'],
    seasons: {
      swMonsoon: { swimming: 3.0, activity: 3.5, weather: 3.0, concern: 'Moderate-high', advice: 'For the travel period sea is bit rough; river sports recommended' },
      interMonsoon: { swimming: 3.5, activity: 3.5, weather: 3.0, concern: 'Moderate', advice: 'Good for coastal relaxation & river safari' },
      neMonsoon: { swimming: 5.0, activity: 4.5, weather: 5.0, concern: 'Low', advice: 'Pristine golden beaches & ideal water sports' }
    }
  },
  {
    displayName: 'Tangalle / Hambantota',
    category: 'seaside',
    aliases: ['tangalle', 'tangalla', 'hambantota', 'rekawa', 'kalametiya', 'dickwella'],
    seasons: {
      swMonsoon: { swimming: 2.5, activity: 3.0, weather: 3.0, concern: 'High', advice: 'For the travel period sea is bit rough; high ocean swells' },
      interMonsoon: { swimming: 3.5, activity: 3.5, weather: 3.0, concern: 'Moderate-high', advice: 'Moderate sea conditions; secluded bay swimming' },
      neMonsoon: { swimming: 4.5, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Calm turquoise bays & pleasant beach weather' }
    }
  },
  {
    displayName: 'Negombo / Colombo',
    category: 'seaside',
    aliases: ['negombo', 'colombo', 'katunayake', 'marawila', 'wattala', 'mount lavinia'],
    seasons: {
      swMonsoon: { swimming: 3.0, activity: 3.5, weather: 3.0, concern: 'Moderate-high', advice: 'For the travel period sea is bit rough; good for city tours & lagoon cruises' },
      interMonsoon: { swimming: 3.5, activity: 3.5, weather: 3.0, concern: 'Moderate', advice: 'Passing showers; convenient transit & urban exploration' },
      neMonsoon: { swimming: 4.5, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Sunny coastal weather & pleasant city sightseeing' }
    }
  },
  {
    displayName: 'Kalpitiya',
    category: 'seaside',
    aliases: ['kalpitiya', 'kandakuliya', 'talawila'],
    seasons: {
      swMonsoon: { swimming: 3.0, activity: 5.0, weather: 4.0, concern: 'Moderate', advice: 'Peak season for kitesurfing; ocean swells present' },
      interMonsoon: { swimming: 3.5, activity: 4.0, weather: 3.5, concern: 'Moderate', advice: 'Good for dolphin watching & lagoon excursions' },
      neMonsoon: { swimming: 4.5, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Pristine waters & dolphin watching season' }
    }
  },
  {
    displayName: 'Arugam Bay',
    category: 'seaside',
    aliases: ['arugam bay', 'arugambay', 'pottuvil'],
    seasons: {
      swMonsoon: { swimming: 3.5, activity: 5.0, weather: 4.5, concern: 'Low', advice: 'World-class surf season & sunny weather' },
      interMonsoon: { swimming: 3.5, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Transition period; moderate wave conditions' },
      neMonsoon: { swimming: 2.5, activity: 2.5, weather: 2.5, concern: 'High', advice: 'For the travel period sea is bit rough; off-season rain' }
    }
  },

  // INLAND LOCATIONS
  {
    displayName: 'Sigiriya / Cultural Triangle',
    category: 'inland',
    aliases: ['sigiriya', 'dambulla', 'habarana', 'polonnaruwa', 'anuradhapura', 'giritale'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 4.0, weather: 4.0, concern: 'Low', advice: 'Dry & sunny; great for rock fortress climb & ancient ruins' },
      interMonsoon: { swimming: 0, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Outdoor activity could be restricted due to rain in afternoon' },
      neMonsoon: { swimming: 0, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Ideal dry weather for cultural explorations & rock hikes' }
    }
  },
  {
    displayName: 'Kandy / Matale',
    category: 'inland',
    aliases: ['kandy', 'matale', 'peradeniya', 'digana', 'teldeniya'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Passing mountain showers; morning temple visits recommended' },
      interMonsoon: { swimming: 0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'Frequent showers; outdoor activity could be restricted due to rain' },
      neMonsoon: { swimming: 0, activity: 4.5, weather: 4.0, concern: 'Low', advice: 'Pleasant hill country climate & clear skies' }
    }
  },
  {
    displayName: 'Ella / Central Highlands',
    category: 'inland',
    aliases: ['ella', 'bandarawela', 'belihuloya', 'badulla', 'wellawaya'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Cool mountain breeze; outdoor activity could be restricted due to rain' },
      interMonsoon: { swimming: 0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'Passing showers expected; outdoor activity could be restricted due to rain' },
      neMonsoon: { swimming: 0, activity: 4.5, weather: 4.0, concern: 'Low', advice: 'Cool mountain climate; optimal for trekking & tea factory visits' }
    }
  },
  {
    displayName: 'Nuwara Eliya / Tea Country',
    category: 'inland',
    aliases: ['nuwara eliya', 'hatton', 'dickoya', 'maskeliya', 'horton plains', 'hakgala', 'kandapola'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'Misty & rainy highland climate; indoor tea tasting recommended' },
      interMonsoon: { swimming: 0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'Passing showers expected; outdoor activity could be restricted due to rain' },
      neMonsoon: { swimming: 0, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Crisp pleasant mountain climate & sunny tea hills' }
    }
  },
  {
    displayName: 'Yala / Udawalawe Safaris',
    category: 'inland',
    aliases: ['yala', 'udawalawe', 'tissamaharama', 'kataragama', 'kirinda'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Dry zone drought; excellent wildlife sightings around waterholes' },
      interMonsoon: { swimming: 0, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Intermonsoon rain; outdoor activity could be restricted due to rain during safaris' },
      neMonsoon: { swimming: 0, activity: 4.5, weather: 4.0, concern: 'Low', advice: 'Lush green park landscapes & great safari conditions' }
    }
  },
  {
    displayName: 'Wilpattu / North West',
    category: 'inland',
    aliases: ['wilpattu', 'puttalam', 'mannar'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 4.0, weather: 4.0, concern: 'Low', advice: 'Warm dry weather; great for safari & national park tours' },
      interMonsoon: { swimming: 0, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Intermittent rain; outdoor activity could be restricted due to rain' },
      neMonsoon: { swimming: 0, activity: 4.5, weather: 4.0, concern: 'Low', advice: 'Pleasant weather for wildlife safaris & lake explorations' }
    }
  },
  {
    displayName: 'Kitulgala / Rain Forest',
    category: 'inland',
    aliases: ['kitulgala', 'sinharaja', 'ratnapura'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 3.5, weather: 4.0, concern: 'Moderate', advice: 'High water levels for white water rafting; intermittent rain' },
      interMonsoon: { swimming: 0, activity: 3.0, weather: 3.0, concern: 'Moderate-high', advice: 'Heavy rain risk; outdoor activity could be restricted due to rain' },
      neMonsoon: { swimming: 0, activity: 4.0, weather: 4.0, concern: 'Low', advice: 'Optimal water levels for adventure activities & hiking' }
    }
  },
  {
    displayName: 'Jaffna',
    category: 'inland',
    aliases: ['jaffna', 'karainagar', 'delft'],
    seasons: {
      swMonsoon: { swimming: 0, activity: 4.5, weather: 4.5, concern: 'Low', advice: 'Dry & sunny northern climate; excellent for cultural exploration' },
      interMonsoon: { swimming: 0, activity: 3.0, weather: 3.5, concern: 'Moderate-high', advice: 'Maha monsoon rain starting; outdoor activity could be restricted due to rain' },
      neMonsoon: { swimming: 0, activity: 3.5, weather: 3.5, concern: 'Moderate', advice: 'Passing seasonal rain; pleasant temperatures' }
    }
  }
];

export class WeatherService {
  /**
   * Generates a seasonal weather report & activity suitability analysis
   * specifically filtered to ONLY the cities visited in the trip.
   */
  static generateWeatherReport(
    arrivalDate?: string,
    departureDate?: string,
    itinerary: InternalItineraryBlock[] = [],
    masterData?: any
  ): WeatherReportData {
    let periodLabel = 'For 10–16 October';
    let monthIndex = 9; // Default October (0-indexed: 9 = Oct)
    let monthName = 'October';

    if (arrivalDate) {
      try {
        const arr = new Date(arrivalDate);
        if (!isNaN(arr.getTime())) {
          monthIndex = arr.getMonth();
          monthName = arr.toLocaleDateString('en-US', { month: 'long' });

          const startDay = arr.getDate();
          if (departureDate) {
            const dep = new Date(departureDate);
            if (!isNaN(dep.getTime())) {
              const endDay = dep.getDate();
              const depMonth = dep.toLocaleDateString('en-US', { month: 'long' });
              if (monthName === depMonth) {
                periodLabel = `For ${startDay}–${endDay} ${monthName}`;
              } else {
                periodLabel = `For ${startDay} ${monthName} – ${endDay} ${depMonth}`;
              }
            } else {
              periodLabel = `For ${monthName}`;
            }
          } else {
            periodLabel = `For ${monthName}`;
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }

    // 1. Extract trip location tokens in chronological order from itinerary blocks
    const rawTripLocations: string[] = [];

    // Prioritize SLEEP blocks (Stay Schedule) and ACTIVITY blocks in chronological order
    itinerary
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .forEach(b => {
        if (b.type === 'sleep' || b.type === 'activity') {
          // Check locationName
          if (b.locationName && b.locationName.trim() !== '') {
            rawTripLocations.push(b.locationName.trim());
          }
          // Check hotelName / hotel details
          if (b.type === 'sleep' && b.hotelName) {
            rawTripLocations.push(b.hotelName.trim());
          }
          if (b.hotelId && masterData?.hotels) {
            const h = masterData.hotels.find((x: any) => x.id === b.hotelId);
            if (h) {
              if (h.city) rawTripLocations.push(h.city);
              if (h.district) rawTripLocations.push(h.district);
              if (h.name) rawTripLocations.push(h.name);
            }
          }
          if (b.name) {
            rawTripLocations.push(b.name);
          }
        }
      });

    // 2. Match raw trip location strings against CITY_CONFIGS
    const matchedConfigs: CityWeatherConfig[] = [];
    const matchedDisplayNames = new Set<string>();

    rawTripLocations.forEach(rawLoc => {
      const cleanLoc = rawLoc.toLowerCase();
      if (cleanLoc.includes('travel') || cleanLoc.includes('transfer')) return;

      const matchedConfig = CITY_CONFIGS.find(cfg => {
        if (matchedDisplayNames.has(cfg.displayName)) return false;
        return cfg.aliases.some(alias => cleanLoc.includes(alias.toLowerCase()));
      });

      if (matchedConfig) {
        matchedDisplayNames.add(matchedConfig.displayName);
        matchedConfigs.push(matchedConfig);
      }
    });

    // Determine seasonal key
    let seasonKey: 'swMonsoon' | 'interMonsoon' | 'neMonsoon' = 'interMonsoon';
    if (monthIndex >= 4 && monthIndex <= 8) {
      seasonKey = 'swMonsoon';
    } else if (monthIndex === 9 || monthIndex === 10) {
      seasonKey = 'interMonsoon';
    } else {
      seasonKey = 'neMonsoon';
    }

    // 3. Build WeatherReportItem array exclusively for the matched trip cities
    const items: WeatherReportItem[] = matchedConfigs.map(cfg => {
      const seasonData = cfg.seasons[seasonKey];
      return {
        location: cfg.displayName,
        category: cfg.category,
        swimmingRating: seasonData.swimming,
        activityRating: seasonData.activity,
        weatherReliabilityRating: seasonData.weather,
        monsoonConcern: seasonData.concern,
        overallTripAdvice: seasonData.advice
      };
    });

    return {
      periodLabel,
      monthName,
      items
    };
  }
}
