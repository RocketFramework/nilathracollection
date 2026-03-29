import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us | Tour Booking Sri Lanka & Organize a Trip",
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
