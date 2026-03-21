import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const destinations = [
    {
        slug: "colombo",
        name: "Colombo",
        type: "Commerce & Culture",
        image: "/images/colombo_morning_drone.avif",
        desc: "The heartbeat of the island, where colonial heritage meets modern luxury.",
    },
    {
        slug: "galle",
        name: "Galle",
        type: "Colonial History",
        image: "/images/galle_fort.avif",
        desc: "A UNESCO World Heritage site, famous for its Dutch Fort and golden beaches.",
    },
    {
        slug: "sigiriya",
        name: "Sigiriya",
        type: "Heritage & History",
        image: "/images/sigiriya_rock.avif",
        desc: "The iconic Lion Rock fortress, a testament to ancient Sri Lankan engineering.",
    },
    {
        slug: "ella",
        name: "Ella",
        type: "Nature & Highlands",
        image: "/images/ella_hero.avif",
        desc: "Mist-covered mountains, tea plantations, and the famous Nine Arch Bridge.",
    },
    {
        slug: "kandy",
        name: "Kandy",
        type: "Culture & Royalty",
        image: "/images/kandy_real.avif",
        desc: "The sacred city, home to the Temple of the Tooth and traditional festivities.",
    },
    {
        slug: "yala",
        name: "Yala",
        type: "Wildlife & Safari",
        image: "/images/yala_hero.avif",
        desc: "Prime wildlife sanctuary famous for the highest concentration of leopards.",
    },
    {
        slug: "nuwara-eliya",
        name: "Nuwara Eliya",
        type: "Tea & Relaxation",
        image: "/images/nuwara_eliya.avif",
        desc: "Little England, a cool-climate retreat known for premium Ceylon tea.",
    },
    {
        slug: "weligama-mirissa",
        name: "Weligama & Mirissa",
        type: "Coastal Synergy",
        image: "/images/tangalle.avif",
        desc: "The heartbeat of the south coast, combining surf culture with luxury whale watching.",
    },
    {
        slug: "trincomalee",
        name: "Trincomalee",
        type: "East Coast Charm",
        image: "/images/trincomalee_hero.avif",
        desc: "Deep-sea harbors, whale watching, and untouched eastern beauty.",
    },
];

export default function DestinationsPage() {
    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="section-subtitle">Exquisite Locations</span>
                        <h1 className="section-title">The Collection of Destinations</h1>
                        <p className="text-brand-charcoal/60 max-w-2xl mx-auto font-light text-lg">
                            Explore the diverse landscapes of Sri Lanka, from heritage sites to untamed wilderness, all experienced in absolute luxury.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {destinations.map((dest) => (
                            <Link
                                key={dest.slug}
                                href={`/destinations/${dest.slug}`}
                                className="group block"
                            >
                                <div className="relative h-[400px] w-full mb-6 overflow-hidden rounded-sm">
                                    <Image
                                        src={dest.image}
                                        alt={dest.name}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-brand-green/20 group-hover:bg-transparent transition-colors duration-500" />
                                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-green font-bold backdrop-blur-sm">
                                        {dest.type}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-serif text-2xl group-hover:text-brand-gold transition-colors">{dest.name}</h3>
                                        <ArrowRight size={20} className="text-brand-gold -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <p className="text-brand-charcoal/60 text-sm font-light leading-relaxed">
                                        {dest.desc}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
