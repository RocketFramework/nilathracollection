const fs = require('fs');
const path = require('path');

const enSlugs = {
    "sigiriya": {
        "name": "Sigiriya",
        "tagline": "The Lion Rock Fortress",
        "description": "Rising 200m above the jungle, Sigiriya is an ancient palace-fortress of incomparable majesty. This UNESCO World Heritage site, the 'Lion Rock', is a masterpiece of 5th-century urban planning, hydraulic engineering, and artistic expression. From the Mirror Wall's ancient graffiti to the vivid frescoes and the massive lion's paws guarding the final ascent, Sigiriya offers a profound encounter with Sri Lanka's royal heritage.",
        "highlights": [
            "Private early-dawn climb with an expert archaeologist",
            "Viewing the 'Sigiriya Damsels' ancient frescoes",
            "Exploring the world's oldest landscaped water gardens",
            "Luxury jungle breakfast with a view of the fortress",
            "Private 'Elephant Corridor' jeep safari nearby"
        ],
        "bestTime": "January to April",
        "experiences": [
            { "name": "Private Guided Tour" },
            { "name": "Luxury Jungle Picnic" },
            { "name": "Heritage Photography" }
        ],
        "accommodations": [
            { "name": "Boutique Heritage Suite (VIP)", "type": "Super Luxury" },
            { "name": "Forest Pavilion (Deluxe)", "type": "Premium" },
            { "name": "Rock View Lodge (Standard)", "type": "Comfort" }
        ]
    },
    "galle": {
        "name": "Galle",
        "tagline": "Colonial Charm & Ocean Breeze",
        "description": "Galle is a jewel where history meets the horizon. A UNESCO World Heritage site, the city is an intricate mosaic of colonial architecture and tropical elegance. The Dutch Fort is the heartbeat of Galle, housing luxury boutique villas, eclectic designer shops, and artisanal cafes within its ancient granite ramparts. Every cobblestone street tells a story of the VOC era, now reimagined as a sophisticated sanctuary for the modern traveler.",
        "highlights": [
            "Private heritage walk with a local historian",
            "Sunset champagne at the Triton Bastion",
            "Whale watching expedition from the harbor",
            "Luxury villa stay within the historic Fort",
            "Curated 'Chef's Table' dining experience"
        ],
        "bestTime": "December to March",
        "experiences": [
            { "name": "Fort Heritage Walk" },
            { "name": "Coastal Sailing" },
            { "name": "Colonial High Tea" }
        ],
        "accommodations": [
            { "name": "The Governor's Mansion (VIP)", "type": "Super Luxury" },
            { "name": "Fort Bliss Boutique (Deluxe)", "type": "Premium" },
            { "name": "Lighthouse Inn (Standard)", "type": "Comfort" }
        ]
    },
    "yala": {
        "name": "Yala",
        "tagline": "Wild Safaris & Leopards",
        "description": "Yala National Park is the most visited and second largest national park in Sri Lanka. The park is best known for its variety of wild animals. It is important for the conservation of Sri Lankan elephants, Sri Lankan leopards and aquatic birds.",
        "highlights": [
            "Exclusive dawn leopard safari",
            "Elephants at the watering holes",
            "Bird watching in the wetlands",
            "Beach walk along the park's coast"
        ],
        "bestTime": "February to June",
        "experiences": [
            { "name": "Private Photographer Safari" },
            { "name": "Luxury Tented Camping" },
            { "name": "Expert Wildlife Tracker" }
        ],
        "accommodations": [
            { "name": "Wild Coast Tented Lodge (VIP)", "type": "Super Luxury" },
            { "name": "Safari Heritage Camp (Deluxe)", "type": "Premium" },
            { "name": "Nature's Edge Lodge (Standard)", "type": "Comfort" }
        ]
    },
    "kandy": {
        "name": "Kandy",
        "tagline": "The Sacred Hill Capital",
        "description": "Nestled amidst misty green hills, Kandy is the cultural soul of Sri Lanka. Home to the sacred Temple of the Tooth Relic, this city offers a blend of spirituality, history, and natural beauty.",
        "highlights": [
            "Visit the Temple of the Tooth Relic",
            "Morning walk around Kandy Lake",
            "Explore the Royal Botanical Gardens",
            "Evening Kandyan dance performance"
        ],
        "bestTime": "January to April",
        "experiences": [
            { "name": "Curated Temple Visit" },
            { "name": "Royal Botanical Tour" },
            { "name": "Cultural Preservation Insight" }
        ],
        "accommodations": [
            { "name": "The King's Pavilion (VIP)", "type": "Super Luxury" },
            { "name": "Misty Mountain Resort (Deluxe)", "type": "Premium" },
            { "name": "City Heritage Lodge (Standard)", "type": "Comfort" }
        ]
    },
    "colombo": {
        "name": "Colombo",
        "tagline": "Luxury Cosmopolitan Hub",
        "description": "A vibrant fusion of colonial-era heritage and ultra-modern ambition, Colombo is the dynamic heartbeat of Sri Lanka. As the island's commercial capital and a burgeoning global hub, the city offers a sophisticated blend of world-class shopping at One Galle Face, exquisite fine dining, and meticulously preserved architecture. From the iconic Lotus Tower piercing the skyline to the historic grandeur of the Galle Face Hotel, Colombo provides a multifaceted luxury experience that serves as the perfect introduction or finale to your Sri Lankan journey.",
        "highlights": [
            "Cinematic sunset views from the Lotus Tower rooftop",
            "Gourmet 'Seafood Symphony' dining at Minister of Crab",
            "Private architectural tour of Geoffrey Bawa's 'No. 11'",
            "Antique car city cruise through the colonial Fort district",
            "Curated shopping experiences at exclusive designer boutiques"
        ],
        "bestTime": "December to March",
        "experiences": [
            { "name": "Urban Heritage Walk" },
            { "name": "Fine Dining Experience" },
            { "name": "Art & Architecture Tour" }
        ],
        "accommodations": [
            { "name": "Shangri-La Horizon (VIP)", "type": "Super Luxury" },
            { "name": "Cinnamon Grand (Deluxe)", "type": "Premium" },
            { "name": "Jetwing Urban (Standard)", "type": "Comfort" }
        ]
    },
    "ella": {
        "name": "Ella",
        "tagline": "The Misty Highland Sanctuary",
        "description": "Perched amidst the emerald peaks of the Central Highlands, Ella is a mist-shrouded sanctuary for nature lovers and seekers of serenity. Famous for its sweeping mountain vistas and the iconic Nine Arch Bridge, this charming village offers a refreshing escape from the tropical heat. With its lush tea plantations, hidden waterfalls, and dramatic rock formations, Ella provides an immersive encounter with the raw beauty of Sri Lanka's hill country.",
        "highlights": [
            "Scenic private hike to the summit of Little Adam's Peak",
            "Sunset views over the iconic Nine Arch Bridge",
            "Curated tea tasting at a historic colonial factory",
            "Luxury villa stay with panoramic views of Ella Gap",
            "Private waterfall picnic at Ravana Falls"
        ],
        "bestTime": "January to May",
        "experiences": [
            { "name": "Private Hike with Naturalists" },
            { "name": "Ceylon Tea Masterclass" },
            { "name": "Waterfall Private Picnic" }
        ],
        "accommodations": [
            { "name": "The Tea Estate Reserve (VIP)", "type": "Super Luxury" },
            { "name": "Mountain View Boutique (Deluxe)", "type": "Premium" },
            { "name": "Mist Valley Inn (Standard)", "type": "Comfort" }
        ]
    },
    "weligama-mirissa": {
        "name": "Weligama & Mirissa",
        "tagline": "The Southern Rhythm",
        "description": "Experience the ultimate coastal synergy where the golden sands of Weligama meet the vibrant bays of Mirissa. This southern duo offers a sophisticated blend of world-class surfing, intimate coastal coves, and the island's premier whale watching expeditions. Whether you're catching waves in the crescent bay of Weligama or watching the sunset from Mirissa's Parrot Rock, the southern coast pulses with a refined energy you won't find anywhere else.",
        "highlights": [
            "Private yacht charter for whale watching",
            "Luxury surf camp experience in Weligama Bay",
            "Sunset cocktails at secluded Mirissa beach clubs",
            "Gourmet seafood dining by the Indian Ocean",
            "Private guided tour of the southern coastline"
        ],
        "bestTime": "November to April",
        "experiences": [
            { "name": "Archery & Water Sports" },
            { "name": "Turtle Hatchery Visit" }
        ],
        "accommodations": [
            { "name": "Saman Villas Exclusive (VIP)", "type": "Super Luxury" },
            { "name": "Vivanta by Taj (Deluxe)", "type": "Premium" },
            { "name": "Bentota Beach Hotel (Standard)", "type": "Comfort" }
        ]
    },
    "nuwara-eliya": {
        "name": "Nuwara Eliya",
        "tagline": "The Little England of Sri Lanka",
        "description": "Elegant, nostalgic, and perpetually cool, Nuwara Eliya is the quintessential highland retreat. Known as 'Little England' for its colonial-era charm and manicured gardens, the city is surrounded by some of the world's most famous tea estates. From the tranquil Gregory Lake to the historic Hill Club, Nuwara Eliya offers a refined sanctuary where the air is fresh and the pace of life gracefully slows down.",
        "highlights": [
            "Private high-tea at a historic colonial bungalow",
            "Guided tour of a premier Ceylon tea factory",
            "Horseback riding through the misty highland plains",
            "Bespoke dining experience overlooking Gregory Lake",
            "Exclusive access to the hill country's elite clubs"
        ],
        "bestTime": "February to May",
        "experiences": [
            { "name": "Tea Masterclass" },
            { "name": "Horton Plains Private Trek" },
            { "name": "Colonial Heritage Walk" }
        ],
        "accommodations": [
            { "name": "Ceylon Tea Trails (VIP)", "type": "Super Luxury" },
            { "name": "The Grand Hotel (Deluxe)", "type": "Premium" },
            { "name": "Jetwing St. Andrew's (Standard)", "type": "Comfort" }
        ]
    },
    "trincomalee": {
        "name": "Trincomalee",
        "tagline": "East Coast Charm & Blue Seas",
        "description": "Trincomalee, on the east coast of Sri Lanka, is home to one of the world's finest natural deep-sea harbors. It offers pristine white sand beaches, sacred Hindu temples, and world-class whale watching opportunities.",
        "highlights": [
            "Private whale & dolphin watching",
            "Visit the sacred Koneswaram Temple",
            "Snorkeling at Pigeon Island",
            "Relax on Nilaveli Beach"
        ],
        "bestTime": "May to October",
        "experiences": [
            { "name": "Deep Sea Whale Safari" },
            { "name": "Temple Heritage Tour" },
            { "name": "Marine Life Exploration" }
        ],
        "accommodations": [
            { "name": "Jungle Beach by Uga (VIP)", "type": "Super Luxury" },
            { "name": "Trinco Blu by Cinnamon (Deluxe)", "type": "Premium" },
            { "name": "Nilaveli Beach Hotel (Standard)", "type": "Comfort" }
        ]
    }
};

const deSlugs = {
    "sigiriya": {
        "name": "Sigiriya",
        "tagline": "Die Löwenfelsen-Festung",
        "description": "Sigiriya ragt 200 Meter über den Dschungel hinaus und ist eine alte Palastfestung von unvergleichlicher Majestät. Dieses UNESCO-Weltkulturerbe, der „Löwenfelsen“, ist ein Meisterwerk der Stadtplanung, Wasserbaukunst und des künstlerischen Ausdrucks aus dem 5. Jahrhundert. Von den antiken Graffiti der Spiegelwand bis hin zu den lebendigen Fresken und den massiven Löwenpfoten, die den letzten Aufstieg bewachen, bietet Sigiriya eine tiefgreifende Begegnung mit dem königlichen Erbe Sri Lankas.",
        "highlights": [
            "Privater Aufstieg im Morgengrauen mit einem erfahrenen Archäologen",
            "Besichtigung der antiken Fresken der „Sigiriya-Mädchen“",
            "Erkundung der ältesten angelegten Wassergärten der Welt",
            "Luxuriöses Dschungelfrühstück mit Blick auf die Festung",
            "Private „Elefantenkorridor“-Jeepsafari in der Nähe"
        ],
        "bestTime": "Januar bis April",
        "experiences": [
            { "name": "Private Führung" },
            { "name": "Luxuriöses Dschungelpicknick" },
            { "name": "Kulturerbe-Fotografie" }
        ],
        "accommodations": [
            { "name": "Boutique Heritage Suite (VIP)", "type": "Super Luxus" },
            { "name": "Forest Pavilion (Deluxe)", "type": "Premium" },
            { "name": "Rock View Lodge (Standard)", "type": "Komfort" }
        ]
    },
    "galle": {
        "name": "Galle",
        "tagline": "Kolonialer Charme & Meeresbrise",
        "description": "Galle ist ein Juwel, wo Geschichte auf den Horizont trifft. Die Stadt, ein UNESCO-Weltkulturerbe, ist ein kunstvolles Mosaik aus kolonialer Architektur und tropischer Eleganz. Das holländische Fort ist das Herz von Galle und beherbergt luxuriöse Boutique-Villen, vielseitige Designer-Shops und handwerkliche Cafés innerhalb seiner alten Granitmauern. Jede Kopfsteinpflasterstraße erzählt eine Geschichte aus der VOC-Ära, die heute als gehobener Zufluchtsort für den modernen Reisenden neu interpretiert wird.",
        "highlights": [
            "Privater Kulturerbespaziergang mit einem lokalen Historiker",
            "Champagner zum Sonnenuntergang an der Triton-Bastion",
            "Walbeobachtungsexpedition vom Hafen aus",
            "Aufenthalt in einer Luxusvilla im historischen Fort",
            "Kuratirtes „Chef's Table“-Speiseerlebnis"
        ],
        "bestTime": "Dezember bis März",
        "experiences": [
            { "name": "Fort Kulturerbespaziergang" },
            { "name": "Segeln an der Küste" },
            { "name": "Kolonialer Nachmittagstee" }
        ],
        "accommodations": [
            { "name": "The Governor's Mansion (VIP)", "type": "Super Luxus" },
            { "name": "Fort Bliss Boutique (Deluxe)", "type": "Premium" },
            { "name": "Lighthouse Inn (Standard)", "type": "Komfort" }
        ]
    },
    "yala": {
        "name": "Yala",
        "tagline": "Wilde Safaris & Leoparden",
        "description": "Der Yala-Nationalpark ist der meistbesuchte und zweitgrößte Nationalpark in Sri Lanka. Der Park ist vor allem für seine Vielfalt an Wildtieren bekannt. Er ist wichtig für die Erhaltung sri-lankischer Elefanten, Leoparden und Wasservögel.",
        "highlights": [
            "Exklusive Leopardensafari im Morgengrauen",
            "Elefanten an den Wasserlöchern",
            "Vogelbeobachtung in den Feuchtgebieten",
            "Strandspaziergang entlang der Küste des Parks"
        ],
        "bestTime": "Februar bis Juni",
        "experiences": [
            { "name": "Private Fotografen-Safari" },
            { "name": "Luxuriöses Zeltlager" },
            { "name": "Erfahrener Wildhüter" }
        ],
        "accommodations": [
            { "name": "Wild Coast Tented Lodge (VIP)", "type": "Super Luxus" },
            { "name": "Safari Heritage Camp (Deluxe)", "type": "Premium" },
            { "name": "Nature's Edge Lodge (Standard)", "type": "Komfort" }
        ]
    },
    "kandy": {
        "name": "Kandy",
        "tagline": "Die heilige Hauptstadt im Hügelland",
        "description": "Eingebettet in neblig-grüne Hügel ist Kandy die kulturelle Seele Sri Lankas. Die Stadt beheimatet den heiligen Zahntempel und bietet eine Mischung aus Spiritualität, Geschichte und natürlicher Schönheit.",
        "highlights": [
            "Besuch des Zahntempels",
            "Morgenspaziergang um den Kandy-See",
            "Erkundung der Königlichen Botanischen Gärten",
            "Abendliche Aufführung von Kandy-Tänzen"
        ],
        "bestTime": "Januar bis April",
        "experiences": [
            { "name": "Kuratirter Tempelbesuch" },
            { "name": "Königliche Botanische Tour" },
            { "name": "Einblicke in die Denkmalpflege" }
        ],
        "accommodations": [
            { "name": "The King's Pavilion (VIP)", "type": "Super Luxus" },
            { "name": "Misty Mountain Resort (Deluxe)", "type": "Premium" },
            { "name": "City Heritage Lodge (Standard)", "type": "Komfort" }
        ]
    },
    "colombo": {
        "name": "Colombo",
        "tagline": "Luxuriöses Kosmopolitisches Zentrum",
        "description": "Als lebendige Verschmelzung von kolonialem Erbe und hochmodernen Ambitionen ist Colombo der dynamische Herzschlag Sri Lankas. Als Wirtschaftsmetropole und aufstrebendes globales Zentrum bietet die Stadt eine gehobene Mischung aus Weltklasse-Shopping im One Galle Face, exquisitem Fine Dining und sorgfältig erhaltener Architektur. Vom ikonenhaften Lotus Tower bis zur historischen Pracht des Galle Face Hotels bietet Colombo ein facettenreiches Luxuserlebnis – perfekt als Auftakt oder Abschluss Ihrer Reise durch Sri Lanka.",
        "highlights": [
            "Filmreife Sonnenuntergänge vom Dach des Lotus Tower",
            "Gourmet 'Seafood Symphony' Dinner bei Minister of Crab",
            "Private Architekturtour durch Geoffrey Bawas 'No. 11'",
            "Oldtimer-Citytour durch das koloniale Fort-Viertel",
            "Kuratierte Shopping-Erlebnisse in exklusiven Designer-Boutiquen"
        ],
        "bestTime": "Dezember bis März",
        "experiences": [
            { "name": "Urbaner Heritage Walk" },
            { "name": "Fine Dining Erlebnis" },
            { "name": "Kunst- & Architekturtour" }
        ],
        "accommodations": [
            { "name": "Shangri-La Horizon (VIP)", "type": "Super Luxus" },
            { "name": "Cinnamon Grand (Deluxe)", "type": "Premium" },
            { "name": "Jetwing Urban (Standard)", "type": "Komfort" }
        ]
    },
    "ella": {
        "name": "Ella",
        "tagline": "Das neblige Hochland-Schutzgebiet",
        "description": "Inmitten der smaragdgrünen Gipfel der zentralen Highlands gelegen, ist Ella ein nebelverhangenes Refugium für Naturliebhaber und Ruhesuchende. Berühmt für seine weiten Bergpanoramen und die ikonische Nine Arch Bridge, bietet dieses charmante Dorf eine erfrischende Flucht vor der tropischen Hitze. Mit seinen üppigen Teeplantagen, versteckten Wasserfällen und dramatischen Felsformationen bietet Ella eine intensive Begegnung mit der rauen Schönheit der sri-lankischen Bergregion.",
        "highlights": [
            "Malerische Privatwanderung auf den Little Adam's Peak",
            "Sonnenuntergang an der legendären Nine Arch Bridge",
            "Kuratierte Teeverkostung in einer historischen Kolonialfabrik",
            "Aufenthalt in einer Luxusvilla mit Panoramablick auf das Ella Gap",
            "Privates Wasserfall-Picknick an den Ravana Falls"
        ],
        "bestTime": "Januar bis Mai",
        "experiences": [
            { "name": "Private Wanderung mit Naturalisten" },
            { "name": "Ceylon Tee Masterclass" },
            { "name": "Privates Wasserfall-Picknick" }
        ],
        "accommodations": [
            { "name": "The Tea Estate Reserve (VIP)", "type": "Super Luxus" },
            { "name": "Mountain View Boutique (Deluxe)", "type": "Premium" },
            { "name": "Mist Valley Inn (Standard)", "type": "Komfort" }
        ]
    },
    "weligama-mirissa": {
        "name": "Weligama & Mirissa",
        "tagline": "Der Rhythmus des Südens",
        "description": "Erleben Sie die ultimative Küstensynergie, wo die goldenen Strände von Weligama auf die lebendigen Buchten von Mirissa treffen. Dieses südliche Duo bietet eine gehobene Mischung aus Weltklasse-Surfen, intimen Küstenbuchten und den herausragendsten Walbeobachtungs-Expeditionen der Insel. Egal, ob Sie die Wellen in der Bucht von Weligama reiten oder den Sonnenuntergang vom Parrot Rock in Mirissa beobachten – die Südküste pulsiert mit einer raffinierten Energie, die Sie nirgendwo sonst finden.",
        "highlights": [
            "Private Yacht-Charter zur Walbeobachtung",
            "Luxus-Surfcamp-Erlebnis in der Weligama Bucht",
            "Sonnenuntergangs-Cocktails in abgelegenen Strandclubs von Mirissa",
            "Gourmet-Meeresfrüchte-Dinner am Indischen Ozean",
            "Private geführte Tour entlang der Südküste"
        ],
        "bestTime": "November bis April",
        "experiences": [
            { "name": "Bogenschießen & Wassersport" },
            { "name": "Besuch einer Schildkrötenaufzuchtstation" }
        ],
        "accommodations": [
            { "name": "Saman Villas Exclusive (VIP)", "type": "Super Luxus" },
            { "name": "Vivanta by Taj (Deluxe)", "type": "Premium" },
            { "name": "Bentota Beach Hotel (Standard)", "type": "Komfort" }
        ]
    },
    "nuwara-eliya": {
        "name": "Nuwara Eliya",
        "tagline": "Das Little England von Sri Lanka",
        "description": "Elegant, nostalgisch und immer angenehm kühl – Nuwara Eliya ist das typische Hochlandrefugium. Bekannt als 'Little England' wegen seines kolonialen Charmes und der gepflegten Gärten, ist die Stadt von einigen der berühmtesten Teeplantagen der Welt umgeben. Vom malerischen Gregory-See bis zum historischen Hill Club bietet Nuwara Eliya eine kultivierte Zuflucht, bei der die Luft frisch ist und das Leben an Eleganz gewinnt.",
        "highlights": [
            "Privater High-Tea in einem historischen Kolonialbungalow",
            "Geführte Tour durch eine prämierten Ceylon-Teefabrik",
            "Ausritte durch die nebligen Ebenen des Hochlandes",
            "Maßgeschneidertes Dinner-Erlebnis mit Blick auf den Gregory Lake",
            "Exklusiver Zugang zu den Elite-Clubs im Hügelland"
        ],
        "bestTime": "Februar bis Mai",
        "experiences": [
            { "name": "Tee Masterclass" },
            { "name": "Private Wanderung durch die Horton Plains" },
            { "name": "Kolonialer Heritage Walk" }
        ],
        "accommodations": [
            { "name": "Ceylon Tea Trails (VIP)", "type": "Super Luxus" },
            { "name": "The Grand Hotel (Deluxe)", "type": "Premium" },
            { "name": "Jetwing St. Andrew's (Standard)", "type": "Komfort" }
        ]
    },
    "trincomalee": {
        "name": "Trincomalee",
        "tagline": "Ostküstencharme & blaues Meer",
        "description": "Trincomalee, an der Ostküste Sri Lankas gelegen, beherbergt einen der besten natürlichen Tiefseehäfen der Welt. Es bietet unberührte Sandstrände, heilige Hindu-Tempel und erstklassige Möglichkeiten zur Walbeobachtung.",
        "highlights": [
            "Private Wal- und Delfinbeobachtung",
            "Besuch des heiligen Koneswaram-Tempels",
            "Schnorcheln an der Pigeon Island (Taubeninsel)",
            "Entspannen am Nilaveli-Strand"
        ],
        "bestTime": "Mai bis Oktober",
        "experiences": [
            { "name": "Tiefsee-Walsafari" },
            { "name": "Tempel-Kulturerbe-Tour" },
            { "name": "Erkundung der Unterwasserwelt" }
        ],
        "accommodations": [
            { "name": "Jungle Beach by Uga (VIP)", "type": "Super Luxus" },
            { "name": "Trinco Blu by Cinnamon (Deluxe)", "type": "Premium" },
            { "name": "Nilaveli Beach Hotel (Standard)", "type": "Komfort" }
        ]
    }
};

const enPath = path.join(__dirname, 'src', 'dictionaries', 'en.json');
const dePath = path.join(__dirname, 'src', 'dictionaries', 'de.json');

const enRaw = fs.readFileSync(enPath, 'utf8');
const deRaw = fs.readFileSync(dePath, 'utf8');

const enDict = JSON.parse(enRaw);
const deDict = JSON.parse(deRaw);

// Add slugs logic
enDict.destination_slugs = enSlugs;
deDict.destination_slugs = deSlugs;

// Also add destination_layout fields found in the code
const enDestLayout = {
    "back_to": "Back to Destinations",
    "the_dest": "The Destination",
    "overview": "Overview",
    "experience_highlights": "Experience Highlights",
    "essential_info": "Essential Info",
    "best_time": "Best Time to Visit",
    "exclusive_offering": "Exclusive Offering",
    "acc_suggestions": "Accommodation Suggestions",
    "inquire": "Inquire About Stay",
    "custom_itin": "Design a custom itinerary including {name} and other premium locations.",
    "include": "Include {name} in Your Luxury Escape",
    "specialists": "Our specialists can blend {name} with other iconic Sri Lankan destinations to create a seamless journey of discovery.",
    "plan_my": "Plan My {name} Experience"
};

const deDestLayout = {
    "back_to": "Zurück zu Reisezielen",
    "the_dest": "Das Reiseziel",
    "overview": "Überblick",
    "experience_highlights": "Erlebnis-Highlights",
    "essential_info": "Wichtige Informationen",
    "best_time": "Beste Reisezeit",
    "exclusive_offering": "Exklusives Angebot",
    "acc_suggestions": "Unterkunftsvorschläge",
    "inquire": "Anfrage für Aufenthalt",
    "custom_itin": "Entwerfen Sie eine individuelle Reiseroute, die {name} und andere Premium-Reiseziele beinhaltet.",
    "include": "Bringen Sie {name} in Ihre Luxusflucht ein",
    "specialists": "Unsere Spezialisten können {name} mit anderen ikonischen Zielen auf Sri Lanka verbinden, um eine nahtlose Entdeckungsreise zu gestalten.",
    "plan_my": "Planen Sie mein {name}-Erlebnis"
};

enDict.destination_layout = enDestLayout;
deDict.destination_layout = deDestLayout;

fs.writeFileSync(enPath, JSON.stringify(enDict, null, 4));
fs.writeFileSync(dePath, JSON.stringify(deDict, null, 4));

console.log("Slugs and layout dictionaries merged.");
