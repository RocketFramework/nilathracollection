const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

async function simulateSave() {
  try {
    const { data: tours } = await supabaseAdmin.from('tours').select('*').order('updated_at', { ascending: false }).limit(1);
    if (!tours || tours.length === 0) return;
    const tour = tours[0];
    const tourId = tour.id;
    const tripData = JSON.parse(JSON.stringify(tour.planner_data));

    // Let's modify the Yala stay (Day 9) to Mandara Resort (1dcd3d53-029d-41ea-8a30-4a17460369da)
    const newHotelId = '1dcd3d53-029d-41ea-8a30-4a17460369da'; // Mandara Resort
    const newRoomId = '6b60c7ca-5e62-4bea-af24-39630265d1b0'; // Standard room

    // 1. Update accommodations Yala day (nightIndex === 9)
    const yalaAcc = tripData.accommodations.find(a => a.nightIndex === 9);
    if (yalaAcc) {
      yalaAcc.hotelId = newHotelId;
      yalaAcc.hotelName = 'Mandara Resort';
      yalaAcc.roomId = newRoomId;
      yalaAcc.roomName = 'Standard Room';
      yalaAcc.selectedRooms = [
        {
          reqId: 'Double',
          roomId: newRoomId,
          mealPlan: 'HB',
          quantity: 3,
          roomName: 'Standard Room',
          agreedTotal: 720,
          roomStandard: 'Superior',
          pricePerNight: 157.927,
          contractedPrice: 143.57
        }
      ];
    }

    // 2. Update sleep block in itinerary (dayNumber === 9)
    const yalaSleepBlock = tripData.itinerary.find(b => b.dayNumber === 9 && b.type === 'sleep');
    if (yalaSleepBlock) {
      yalaSleepBlock.hotelId = newHotelId;
      yalaSleepBlock.hotelName = 'Mandara Resort';
      yalaSleepBlock.roomName = 'Standard Room';
    }

    // Now run the saveTour logic!
    const { data: dbActivities } = await supabaseAdmin.from('activities').select('id, activity_name');
    const { data: rawSettings } = await supabaseAdmin.from('app_settings').select('setting_key, setting_value');
    const settingsMap = {};
    if (rawSettings) {
      rawSettings.forEach(s => settingsMap[s.setting_key] = Number(s.setting_value) || 0);
    }
    const roomMarkup = settingsMap.room_markup || 10;

    const blocks = tripData.itinerary || [];
    const processedDistances = new Set();
    let totalKm = 0;
    let totalCities = new Set();
    let totalActivities = 0;
    const activityMix = {};

    const { data: actData } = await supabaseAdmin.from('activities').select('id, category');
    const catMap = new Map(actData?.map(a => [a.id, a.category]) || []);

    blocks.forEach(b => {
      if (b.distance) {
        const num = parseInt(b.distance.toString().replace(/[^0-9]/g, ''));
        if (!isNaN(num) && num > 0) {
          const dedupeKey = `${b.dayNumber}-${b.locationName}-${num}`;
          if (!processedDistances.has(dedupeKey)) {
            processedDistances.add(dedupeKey);
            totalKm += num;
          }
        }
      }
      if (b.locationName) totalCities.add(b.locationName.split(',')[0].trim());
      if (b.type === 'activity') {
        totalActivities++;
        const cat = (b.activityId ? catMap.get(b.activityId) : null) || 'General';
        activityMix[cat] = (activityMix[cat] || 0) + 1;
      }
    });

    // Save basic relational info
    const { data: tourData, error: tourErr } = await supabaseAdmin
      .from('tours')
      .update({
        title: tripData.clientName,
        status: tripData.status,
        start_date: tripData.profile?.arrivalDate || null,
        end_date: tripData.profile?.departureDate || null,
        total_km: totalKm,
        total_cities: totalCities.size,
        total_activities: totalActivities,
        activity_mix: activityMix
      })
      .eq('id', tourId)
      .select('request_id, status, tourist_id')
      .single();

    if (tourErr) throw tourErr;

    // Sync itinerary to relational tables
    const { error: daDeleteErr } = await supabaseAdmin.from('daily_activities').delete().eq('tour_id', tourId);
    if (daDeleteErr) console.error("Failed to delete daily_activities:", daDeleteErr);

    const { error: itinDeleteErr } = await supabaseAdmin.from('tour_itineraries').delete().eq('tour_id', tourId);
    if (itinDeleteErr) console.error("Failed to delete tour_itineraries:", itinDeleteErr);

    const blocksByDay = {};
    for (const block of tripData.itinerary) {
      if (!blocksByDay[block.dayNumber]) blocksByDay[block.dayNumber] = [];
      blocksByDay[block.dayNumber].push(block);
    }

    const days = Object.keys(blocksByDay).map(Number).sort((a, b) => a - b);
    let grandTotalCost = 0;

    for (const day of days) {
      let dayDate = null;
      if (tripData.profile?.arrivalDate) {
        const dateObj = new Date(tripData.profile.arrivalDate);
        dateObj.setDate(dateObj.getDate() + (day - 1));
        dayDate = dateObj.toISOString().split('T')[0];
      }

      const matchingHotel = tripData.accommodations?.find(h => h.nightIndex === day);
      let dbHotelId = (matchingHotel?.hotelId && isUuid(matchingHotel.hotelId)) ? matchingHotel.hotelId : null;

      if (dbHotelId) {
        const { data: exists } = await supabaseAdmin
          .from('hotels')
          .select('id')
          .eq('id', dbHotelId)
          .single();

        if (!exists) {
          dbHotelId = null;
        }
      }

      const { data: dbItin, error: itinErr } = await supabaseAdmin
        .from('tour_itineraries')
        .insert([{
          tour_id: tourId,
          day_number: day,
          date: dayDate,
          title: `Day ${day}`,
          hotel_id: dbHotelId
        }])
        .select('id')
        .single();

      if (itinErr) throw itinErr;

      const dayBlocks = blocksByDay[day];
      const activitiesToInsert = [];

      for (const b of dayBlocks) {
        if (!b.id || !isUuid(b.id)) continue;
        
        let vendorId = b.vendorId || null;
        if (vendorId && !isUuid(vendorId)) vendorId = null;

        let vendorActivityId = b.vendorActivityId || null;
        let activityId = b.activityId !== undefined && b.activityId !== null ? Number(b.activityId) : null;

        let basePayload = {
          id: b.id,
          tour_id: tourId,
          itinerary_id: dbItin.id,
          title: b.name,
          activity_type: b.type || null,
          location_name: b.locationName || null,
          distance: (b.distance !== undefined && b.distance !== null && b.distance !== '') ? String(b.distance) : null,
          description: b.comments && b.comments.length > 0 ? JSON.stringify(b.comments) : (b.internalNotes || ''),
          time_start: b.startTime || null,
          time_end: b.endTime || null,
          vendor_id: vendorId,
          activity_id: activityId,
          vendor_activity_id: vendorActivityId,
          contracted_price: b.contractedPrice,
          charged_unit_price: b.agreedPrice,
          charged_total_price: b.agreedPrice,
          hotel_id: (b.hotelId && isUuid(b.hotelId)) ? b.hotelId : null,
          price_finalized: b.priceFinalized || false
        };

        if (b.type === 'sleep') {
          const acc = tripData.accommodations?.find(a => a.nightIndex === day);
          if (acc && acc.selectedRooms && acc.selectedRooms.length > 0) {
            let totalAgreedPrice = 0;
            let totalContractedPrice = 0;
            let totalRooms = 0;
            let mealPlan = null;

            if (!basePayload.hotel_id && isUuid(acc.hotelId)) {
              basePayload.hotel_id = acc.hotelId;
            }

            for (const room of acc.selectedRooms) {
              const reqType = room.reqId?.split('-')[0];
              const validRoomId = isUuid(room.roomId) ? room.roomId : null;
              totalRooms += room.quantity;

              if (reqType === 'Single') {
                basePayload.single_room_id = validRoomId;
                basePayload.single_room_count = room.quantity;
              } else if (reqType === 'Double') {
                basePayload.double_room_id = validRoomId;
                basePayload.double_room_count = room.quantity;
              } else if (reqType === 'Twin') {
                basePayload.twin_room_id = validRoomId;
                basePayload.twin_room_count = room.quantity;
              } else if (reqType === 'Triple') {
                basePayload.triple_room_id = validRoomId;
                basePayload.triple_room_count = room.quantity;
              } else if (reqType === 'Family') {
                basePayload.family_room_id = validRoomId;
                basePayload.family_room_count = room.quantity;
              }

              const baseContractedUnit = room.contractedPrice !== undefined ? room.contractedPrice : room.pricePerNight;
              totalContractedPrice += baseContractedUnit * room.quantity;
              const dynamicAgreedUnit = baseContractedUnit * (1 + (roomMarkup / 100));
              totalAgreedPrice += room.agreedTotal !== undefined ? room.agreedTotal : (dynamicAgreedUnit * room.quantity);
              if (room.mealPlan && !mealPlan) mealPlan = room.mealPlan;
            }

            let primaryRoomId = (acc.roomId && isUuid(acc.roomId)) ? acc.roomId : null;
            if (!primaryRoomId) {
              const firstRoom = acc.selectedRooms.find(r => isUuid(r.roomId));
              if (firstRoom) primaryRoomId = firstRoom.roomId;
            }
            if (basePayload.hotel_id && primaryRoomId) {
              basePayload.hotel_room_id = primaryRoomId;
            }

            basePayload.charged_total_price = totalAgreedPrice > 0 ? totalAgreedPrice : null;
            basePayload.quantity = totalRooms > 0 ? totalRooms : 1;
            basePayload.charged_unit_price = totalAgreedPrice > 0 && totalRooms > 0 ? totalAgreedPrice / totalRooms : null;
            basePayload.contracted_price = totalContractedPrice > 0 && totalRooms > 0 ? totalContractedPrice / totalRooms : null;
            basePayload.contracted_total_price = totalContractedPrice > 0 ? totalContractedPrice : null;
            basePayload.meal_plan = mealPlan;

            activitiesToInsert.push(basePayload);
          } else if (acc) {
            const assumedRoomId = acc.roomId && isUuid(acc.roomId) ? acc.roomId : null;
            const assumedQty = acc.numberOfRooms || 1;
            if (!basePayload.hotel_id && isUuid(acc.hotelId)) {
              basePayload.hotel_id = acc.hotelId;
            }
            if (basePayload.hotel_id && assumedRoomId) {
              basePayload.hotel_room_id = assumedRoomId;
            }
            basePayload.double_room_id = assumedRoomId;
            basePayload.double_room_count = assumedQty;
            basePayload.quantity = assumedQty;
            basePayload.charged_unit_price = acc.pricePerNight || null;
            basePayload.charged_total_price = (acc.pricePerNight && assumedQty) ? acc.pricePerNight * assumedQty : null;
            basePayload.contracted_price = b.contractedPrice || null;
            basePayload.contracted_total_price = (b.contractedPrice != null && assumedQty != null) ? b.contractedPrice * assumedQty : null;
            basePayload.meal_plan = acc.mealPlan || null;

            activitiesToInsert.push(basePayload);
          }
        }
      }

      if (activitiesToInsert.length > 0) {
        const { error: actErr } = await supabaseAdmin.from('daily_activities').insert(activitiesToInsert);
        if (actErr) throw actErr;
      }
    }

    const { error: finalUpdateErr } = await supabaseAdmin.from('tours').update({
      planner_data: tripData
    }).eq('id', tourId);
    if (finalUpdateErr) throw finalUpdateErr;

    console.log('SIMULATION COMPLETED SUCCESSFULLY! No errors thrown.');
  } catch (error) {
    console.error('SIMULATION FAILED WITH ERROR:', error);
  }
}

simulateSave();
