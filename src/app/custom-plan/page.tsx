import CustomPlanContent from "./CustomPlanContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Trip Planner | Design Your Custom Sri Lankan Journey",
    description: "Use our intelligent AI trip planner to design your perfect Sri Lankan escape. Select your favorite activities and let us architect your bespoke itinerary.",
    openGraph: {
        title: "AI Trip Planner | Nilathra Collection",
        description: "Design your bespoke Sri Lankan journey with our AI-powered planner.",
        images: ["/images/hero_ella_bridge.png"],
    },
};

export default function CustomPlanPage() {
    return <CustomPlanContent />;
}
