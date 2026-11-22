import { withLocalizedCanonical } from "@/utils/seo-i18n";
import CustomPlanContent from "./CustomPlanContent";
import { Metadata } from "next";

const baseMetadata: Metadata = {
    title: "Tailor Your Journey | Bespoke Sri Lanka Itineraries",
    description: "Use our intelligent AI trip planner to design your perfect Sri Lankan escape. Select your favorite activities and let us architect your bespoke itinerary.",
    alternates: {
        canonical: "https://www.nilathra.com/custom-plan",
    },
    openGraph: {
        title: "AI Trip Planner | Nilathra Collection",
        description: "Design your bespoke Sri Lankan journey with our AI-powered planner.",
        images: ["/images/hero_ella_bridge.avif"],
    },
};

export async function generateMetadata(): Promise<Metadata> {
    return withLocalizedCanonical("/custom-plan", baseMetadata);
}

export default function CustomPlanPage() {
    return <CustomPlanContent />;
}
