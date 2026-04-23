import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Concierge | Personalized Luxury Travel Assistance",
    description: "Reach out to our 24/7 concierge team to design your legacy journey in Sri Lanka. Discrete and elegant service for discerning travelers.",
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
