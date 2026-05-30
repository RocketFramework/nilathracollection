import ContactClient from "./ContactClient";
import { Metadata } from "next";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const planNames: Record<string, string> = {
    "ultra-vip": "Ultra VIP Plan",
    "imperial-helicopter": "The Imperial Helicopter Route",
    "elite-journey": "Luxury - Signature Ceylon Experience",
    "luxury": "Luxury Plan",
    "premium": "Premium Plan",
    "regular": "Regular Plan",
    "mixed": "Custom Mixed Plan",
};

export async function generateMetadata({
    searchParams,
}: {
    searchParams: SearchParams;
}): Promise<Metadata> {
    const params = await searchParams;
    const plan = params.plan;
    const hasParams = Object.keys(params).length > 0;

    // Handle potential string array or single string from query parameters
    const planStr = Array.isArray(plan) ? plan[0] : plan;
    const planName = planStr ? planNames[planStr] : null;

    if (planName) {
        return {
            title: `Contact Concierge - ${planName}`,
            description: `Design your bespoke ${planName.toLowerCase()} in Sri Lanka. Reach out to our 24/7 concierge team for discrete and personalized luxury travel planning.`,
            alternates: {
                canonical: "https://www.nilathra.com/contact",
            },
            robots: {
                index: !hasParams,
                follow: true,
            },
        };
    }

    return {
        title: "Contact Concierge | Personalized Luxury Travel Assistance",
        description: "Reach out to our 24/7 concierge team to design your legacy journey in Sri Lanka. Discrete and elegant service for discerning travelers.",
        alternates: {
            canonical: "https://www.nilathra.com/contact",
        },
        robots: {
            index: !hasParams,
            follow: true,
        },
    };
}

export default function ContactPage() {
    return <ContactClient />;
}
