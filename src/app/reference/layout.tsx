import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Travel Reference & Essentials",
    description: "Official resources and essential information for travelers to Sri Lanka, including visa links and health guidelines.",
};

export default function ReferenceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
