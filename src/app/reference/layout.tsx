import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reference Information | Organize a Trip to Sri Lanka",
};

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
