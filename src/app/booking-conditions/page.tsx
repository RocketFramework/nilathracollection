import MainLayout from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Shield, Gavel, FileText, CreditCard, UserCheck, Stethoscope, AlertCircle, HelpCircle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Booking Conditions | Tour Booking Sri Lanka Policy",
};
export default function BookingConditionsPage() {
    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden bg-brand-green">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-gold rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <span className="text-brand-gold font-medium uppercase tracking-[0.4em] text-sm mb-4 block">Legal</span>
                    <h1 className="text-4xl md:text-6xl font-serif">Booking Conditions</h1>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg max-w-none text-brand-charcoal/80 font-light space-y-12">

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Shield size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Introduction</h2>
                            </div>
                            <p>
                                Thank you for choosing Nilathra Collection. This website is owned and operated by <strong>Nilathra Hotel Management (Pvt) Ltd</strong>, a company registered in Sri Lanka and formally licensed under the <strong>Sri Lanka Tourist Development Authority (SLTDA)</strong>.
                            </p>
                            <p>
                                When you make a booking for a Nilathra Collection travel experience, your contract is with Nilathra Hotel Management (Pvt) Ltd trading as Nilathra Collection. In these terms and conditions "we", "us", or "our" mean Nilathra Collection. These conditions form the basis of your contract with us; please read them carefully as they are legally binding.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <FileText size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Contract</h2>
                            </div>
                            <p>
                                Our bookings are tailored to your specific requirements and are subject to availability. Before a booking is confirmed, you will receive a detailed itinerary proposal via email. Once you have confirmed your satisfaction with the proposal, we will proceed to secure arrangements and issue a formal booking confirmation.
                            </p>
                            <p>
                                A binding contract is formed only when we issue a booking confirmation after receiving the required deposit or full payment. By making a booking, the lead name on the reservation accepts authority to bind all members of the party to these terms and conditions.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <CreditCard size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Price and Payment</h2>
                            </div>
                            <p>
                                Prices are quoted in USD or LKR based on current exchange rates. We reserve the right to alter prices at any time before your booking is confirmed. The price of your experience is inclusive of applicable Sri Lankan taxes, including VAT and Tourism Development Levy (TDL), unless otherwise specified.
                            </p>
                            <p>
                                A deposit is required to secure your booking. The balance is generally due 8 to 12 weeks prior to departure, depending on the nature of the itinerary. For bookings made close to the departure date, the full price may be due immediately. Payments can be made via bank transfer or major credit cards.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <UserCheck size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Insurance</h2>
                            </div>
                            <p>
                                It is a mandatory condition of booking with Nilathra Collection that you and all members of your party take out comprehensive travel insurance. This should cover medical expenses, personal injury, repatriation, and cancellation or curtailment of your trip. We are not liable for any costs incurred due to insufficient insurance coverage.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Stethoscope size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Passports, Visas and Health</h2>
                            </div>
                            <p>
                                It is your responsibility to ensure that all members of your party possess valid passports (typically valid for at least 6 months beyond the date of return) and the necessary visas for entry into Sri Lanka (ETA). You must also comply with any health formalities or vaccination requirements. We do not accept liability if entry is refused due to incorrect documentation.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <AlertCircle size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Amendments and Cancellations</h2>
                            </div>
                            <p>
                                <strong>By You:</strong> Any request for amendment or cancellation must be sent in writing. Cancellation charges apply based on the notice period provided before departure. These charges represent our reasonable costs and the potential loss of business from reserved services.
                            </p>
                            <p>
                                <strong>By Us:</strong> Occasionally, we may need to make changes to your confirmed arrangements. Most changes are minor, and we will advise you as soon as possible. If a significant change is required, you will have the option to accept the change, take a substitute experience, or cancel for a full refund.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Gavel size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Jurisdiction</h2>
                            </div>
                            <p>
                                This contract and any matters arising from it are governed by the laws of <strong>Sri Lanka</strong> and are subject to the exclusive jurisdiction of the Sri Lankan courts.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <HelpCircle size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Complaints</h2>
                            </div>
                            <p>
                                If you experience any issues during your trip, please inform our representatives or the relevant service provider immediately to allow us the opportunity to resolve the matter locally. If the problem remains unresolved, please contact us in writing within 28 days of your return.
                            </p>
                        </div>

                        <div className="pt-12 border-t border-brand-charcoal/10 text-brand-charcoal/60 text-sm">
                            <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <p>Nilathra Hotel Management (Pvt) Ltd | SLTDA Registered Agency</p>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
