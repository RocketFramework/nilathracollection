import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Our Plans | Tour Sri Lanka from Colombo & Tour Sri Lanka",
};

export default function PlansLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
