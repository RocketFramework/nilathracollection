import { TourService } from '../src/services/tour.service';

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2'; // Rasika Ranasinghe
  try {
    const { tripData } = await TourService.getTourData(tourId);
    console.log("SUCCESS: Loaded tour data via TourService!");
    console.log("Client Name:", tripData.clientName);
    console.log("Client Passport:", tripData.clientPassport);
    console.log("Client Phone:", tripData.clientPhone);
    console.log("Client Address:", tripData.clientAddress);
    console.log("Client Profile Dates:");
    console.log("  Arrival Date:", tripData.profile?.arrivalDate);
    console.log("  Departure Date:", tripData.profile?.departureDate);
    console.log("  Adults Count:", tripData.profile?.adults);
    console.log("  Children Count:", tripData.profile?.children);
    console.log("  Infants Count:", tripData.profile?.infants);
    console.log("Itinerary Sleep Blocks:");
    const sleepBlocks = (tripData.itinerary || []).filter((b: any) => b.type === 'sleep');
    sleepBlocks.forEach((b: any) => {
      console.log(`  Day ${b.dayNumber}: Hotel ID: ${b.hotelId}, Hotel Name: ${b.hotelName}, Room Name: ${b.roomName}`);
    });
  } catch (err) {
    console.error("Error loading tour data:", err);
  }
}

run();
