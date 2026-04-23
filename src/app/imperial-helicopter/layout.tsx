import { Metadata } from "next";

export const metadata: Metadata = {
    title: "The Imperial Helicopter Route",
    description: "Experience Sri Lanka from above with our exclusive 5-night helicopter journey. Private charters, elite stays, and unparalleled views.",
};

export default function ImperialHelicopterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
