import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Careers | Join the Collection",
    description: "Build your career with Sri Lanka's premier luxury travel curator. We are looking for passionate professionals to join our elite team.",
};

export default function CareersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
