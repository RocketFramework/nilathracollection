import MainLayout from "@/components/layout/MainLayout";
import { Shield, Lock, Eye, Users, Globe, Database, Scale, Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Nilathra Collection Sri Lanka Tour Website",
};
export default function PrivacyPolicyPage() {
    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden bg-brand-green">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-gold rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <span className="text-brand-gold font-medium uppercase tracking-[0.4em] text-sm mb-4 block">Compliance</span>
                    <h1 className="text-4xl md:text-6xl font-serif">Privacy Policy</h1>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg max-w-none text-brand-charcoal/80 font-light space-y-12">

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Shield size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Important Information and Who We Are</h2>
                            </div>
                            <p>
                                Nilathra Collection respects your privacy and is committed to protecting your personal data. This privacy policy is designed to tell you about our information collection practices – that is, the ways we collect information; what kinds of information we collect; why we collect information; how we use information we collect; with whom we share information we collect; how you can access, amend, and delete information we collect from you; and what kinds of security we use to protect information you provide.
                            </p>
                            <p>
                                It is important that you read this privacy policy together with any other privacy policy or fair processing notice that we may provide on specific occasions when we are collecting or processing personal data about you so that you are fully aware of how and why we are using your data.
                            </p>
                            <h3 className="text-xl font-serif text-brand-green">Controller</h3>
                            <p>
                                <strong>Nilathra Hotel Management (Pvt) Ltd</strong> is the data controller and responsible for your personal data (referred to as "Nilathra Collection", "we", "us" or "our" in this privacy policy).
                            </p>
                            <p>
                                We have appointed a Data Privacy Manager who is responsible for overseeing questions in relation to this privacy policy. If you have any questions about this privacy policy, including any requests to exercise your legal rights, please contact the Data Privacy Manager at <strong>concierge@nilathra.com</strong>.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Database size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">The Data We Collect About You</h2>
                            </div>
                            <p>
                                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Identity Data</strong>: includes first name, last name, username, title, and date of birth.</li>
                                <li><strong>Contact Data</strong>: includes billing address, email address, and telephone numbers.</li>
                                <li><strong>Financial Data</strong>: includes bank account and payment card details.</li>
                                <li><strong>Transaction Data</strong>: includes details about payments and travel services purchased.</li>
                                <li><strong>Technical Data</strong>: includes IP address, browser type, and device information.</li>
                                <li><strong>Profile Data</strong>: includes itinerary preferences, feedback, and survey responses.</li>
                                <li><strong>Usage Data</strong>: includes information about how you use our website and services.</li>
                            </ul>

                            <h3 className="text-xl font-serif text-brand-green">Special Category Data</h3>
                            <p>
                                <strong>Health/mobility data</strong>: When you make a travel booking, we may ask you to disclose medical conditions or mobility restrictions to ensure your safety and welfare during your trip. Providing this constitutes your consent for us to use this information to make your travel arrangements.
                            </p>
                            <p>
                                <strong>Religious beliefs</strong>: We may ask for dietary requirements or religious beliefs if they inform your itinerary choices. Providing this confirms your consent for us to use this for your travel arrangements.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Eye size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">How We Collect Your Data</h2>
                            </div>
                            <p>
                                We use different methods to collect data, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Direct interactions</strong>: By filling in forms, or communicating by email or phone.</li>
                                <li><strong>Automated technologies</strong>: Using cookies and server logs as you interact with our website.</li>
                                <li><strong>Third parties</strong>: Technical data from analytics providers (e.g., Google Analytics).</li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Lock size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">How We Use Your Data</h2>
                            </div>
                            <p>
                                We only use your data when the law allows us to, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To perform the contract we are about to enter into with you.</li>
                                <li>Where it is necessary for our legitimate interests.</li>
                                <li>To comply with a legal obligation.</li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Users size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Disclosures of Your Data</h2>
                            </div>
                            <p>
                                We may share your personal data with:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Travel Suppliers</strong>: Airlines, hotels, and destination management companies to fulfil your booking.</li>
                                <li><strong>Public Authorities</strong>: Customs, immigration, and security agencies as required by law.</li>
                                <li><strong>Professional Advisers</strong>: Lawyers, bankers, and insurers for business operations.</li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Globe size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">International Data Transfers</h2>
                            </div>
                            <p>
                                Nilathra Collection is hosted on <strong>Vercel</strong>, which utilizes a <strong>global cloud infrastructure</strong>. By using our website and services, you acknowledge and agree that your personal data may be transferred to, and stored on, servers located in various regions worldwide to ensure optimal performance and availability.
                            </p>
                            <p>
                                Furthermore, many of our external travel suppliers (e.g., airlines, international hotel groups) are based outside your home country. Your data processing will involve transfers across borders to fulfil your travel itineraries. Whenever we transfer your personal data, we ensure a similar degree of protection is afforded to it by ensuring at least one legal safeguard is implemented.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Scale size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Your Legal Rights</h2>
                            </div>
                            <p>
                                Under certain circumstances, you have rights under data protection laws, including the right to request access, correction, erasure, or restriction of your personal data. You also have the right to withdraw consent at any time.
                            </p>
                        </div>

                        <div className="pt-12 border-t border-brand-charcoal/10 text-brand-charcoal/60 text-sm">
                            <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <p>Nilathra Hotel Management (Pvt) Ltd | Data Privacy Management Team</p>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
