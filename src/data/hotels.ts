export interface HotelInventoryItem {
    id: string;
    name: string;
    standard: 'Budget' | 'Premium' | 'Luxury' | 'Ultra Luxury VIP' | 'Mixed';
    locations: string[]; // e.g. ["Colombo", "Kandy"]
    baseRatePerNightUsd: number;
    stayClass: string;
    contactPerson: string;
    contactNumber: string;
    email: string;
}

export const hotelInventory: HotelInventoryItem[] = [
    {
        id: "HOT-001",
        name: "Galle Face Hotel",
        standard: "Luxury",
        locations: ["Colombo"],
        baseRatePerNightUsd: 150,
        stayClass: "5 Star",
        contactPerson: "Reservations Manager",
        contactNumber: "+94 11 254 1010",
        email: "reservations@gallefacehotel.net"
    },
    {
        id: "HOT-002",
        name: "Shangri-La Colombo",
        standard: "Ultra Luxury VIP",
        locations: ["Colombo"],
        baseRatePerNightUsd: 250,
        stayClass: "5 Star Luxury",
        contactPerson: "VIP Desk",
        contactNumber: "+94 11 788 8288",
        email: "slcb@shangri-la.com"
    },
    {
        id: "HOT-003",
        name: "Cinnamon Red",
        standard: "Premium",
        locations: ["Colombo"],
        baseRatePerNightUsd: 85,
        stayClass: "4 Star",
        contactPerson: "Front Desk",
        contactNumber: "+94 11 200 0900",
        email: "info.red@cinnamonhotels.com"
    },
    {
        id: "HOT-004",
        name: "Heritance Kandalama",
        standard: "Luxury",
        locations: ["Dambulla", "Sigiriya"],
        baseRatePerNightUsd: 180,
        stayClass: "5 Star",
        contactPerson: "Booking Office",
        contactNumber: "+94 66 555 5000",
        email: "kandalama@heritancehotels.com"
    },
    {
        id: "HOT-005",
        name: "Earl's Regency",
        standard: "Premium",
        locations: ["Kandy"],
        baseRatePerNightUsd: 110,
        stayClass: "5 Star",
        contactPerson: "Reservations",
        contactNumber: "+94 81 223 2222",
        email: "res.regency@aitkenspence.lk"
    },
    {
        id: "HOT-006",
        name: "Amangalla",
        standard: "Ultra Luxury VIP",
        locations: ["Galle"],
        baseRatePerNightUsd: 650,
        stayClass: "Boutique Luxury",
        contactPerson: "General Manager",
        contactNumber: "+94 91 223 3388",
        email: "amangalla@aman.com"
    },
    {
        id: "HOT-007",
        name: "Jetwing Lighthouse",
        standard: "Luxury",
        locations: ["Galle"],
        baseRatePerNightUsd: 160,
        stayClass: "5 Star",
        contactPerson: "Booking Assistant",
        contactNumber: "+94 91 222 3744",
        email: "resv.lighthouse@jetwinghotels.com"
    },
    {
        id: "HOT-008",
        name: "Budget Inn Colombo",
        standard: "Budget",
        locations: ["Colombo"],
        baseRatePerNightUsd: 35,
        stayClass: "3 Star",
        contactPerson: "Owner",
        contactNumber: "+94 11 211 1111",
        email: "stay@budgetinn.lk"
    }
];

export async function fetchHotelInventory(): Promise<HotelInventoryItem[]> {
    // Mimic API/DB delay for future-proofing
    return new Promise(resolve => setTimeout(() => resolve(hotelInventory), 300));
}
