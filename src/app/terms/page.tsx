import MainLayout from "@/components/layout/MainLayout";
import { Info, MousePointer2, Phone, UserCheck, ShieldAlert, Plane, Building2, Clock, Camera, FileCheck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | Sri Lanka Tour Website",
};
export default function TermsOfServicePage() {
    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden bg-brand-green">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-gold rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <span className="text-brand-gold font-medium uppercase tracking-[0.4em] text-sm mb-4 block">Usage</span>
                    <h1 className="text-4xl md:text-6xl font-serif">Terms of Service</h1>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg max-w-none text-brand-charcoal/80 font-light space-y-12">

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Info size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Website Use & Responsibility</h2>
                            </div>
                            <p>
                                Welcome to Nilathra Collection. These Terms of Service govern your use of our website and our booking services. By accessing this site, you agree to these terms. If you disagree with any section, please do not use our services.
                            </p>
                            <p>
                                Services rendered are subject to availability. When making a reservation, you certify that you are authorized to accept these terms on behalf of yourself and all members of your traveling party. You are responsible for the authenticity of all information provided to us.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-brand-green">
                                    <MousePointer2 size={24} className="text-brand-gold" />
                                    <h2 className="text-2xl font-serif m-0">Online Procedures</h2>
                                </div>
                                <p className="text-sm">
                                    When booking online, you must provide accurate data and ensure the payment method used is your own or that you have explicit authority to use it. Upon successful reservation, we will issue a verification invoice and confirmation email.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-brand-green">
                                    <Phone size={24} className="text-brand-gold" />
                                    <h2 className="text-2xl font-serif m-0">Telephonic Procedures</h2>
                                </div>
                                <p className="text-sm">
                                    For bookings made via telephone, all required data must be provided accurately. A reservation made over the phone is considered valid once the verification invoice is dispatched. Please review all details immediately upon receipt.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <ShieldAlert size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Conduct & Compliance</h2>
                            </div>
                            <p>
                                You agree to be liable for your behavior and your party&apos;s conduct. It must not be offensive to others or pose a threat of damage to property. If damage occurs, compensation must be made directly to the owner or administrator of the property.
                            </p>
                            <p>
                                We reserve the right to terminate your arrangements without notice if your conduct is deemed socially unacceptable or involves illicit actions. In such cases, no refunds or reimbursements will be provided. You are also liable to observe all local laws, norms, and regulations of Sri Lanka or any country you visit during your journey.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Plane size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Travel Logistics</h2>
                            </div>
                            <p>
                                <strong>Flight Schedules:</strong> Departure and arrival times are approximations set by the airlines and are subject to change due to air traffic control, weather, or operational needs. Lateness is at the full discretion of the airline and we cannot make specific arrangements if you are delayed.
                            </p>
                            <p>
                                <strong>Confirmation:</strong> It is your responsibility to confirm all flights (outgoing and incoming) at least 72 hours prior to departure. We are not responsible for additional costs arising from a failure to confirm.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <Building2 size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Accommodation Standards</h2>
                            </div>
                            <p>
                                Ratings for hotels and lodging are provided as a general guide and are not official international ratings. Standards of comfort and facilities vary significantly between countries and even within regions. Nilathra Collection does not guarantee exclusive use of listed accommodations unless specifically stated.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-green">
                                    <Clock size={20} className="text-brand-gold" />
                                    <h3 className="text-xl font-serif m-0">Physical Logistics</h3>
                                </div>
                                <p>
                                    Check-in and check-out times follow local hotel policies (typically 2:00 PM check-in and 11:00 AM check-out). Extra beds or cots will involve additional charges and must be requested in advance.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-green">
                                    <Camera size={20} className="text-brand-gold" />
                                    <h3 className="text-xl font-serif m-0">Visual Accuracy</h3>
                                </div>
                                <p>
                                    We strive to display accurate imagery. However, images are intended to provide an overall look of the property and may not represent the exact room or specific view assigned at the time of stay.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-brand-green">
                                <FileCheck size={24} className="text-brand-gold" />
                                <h2 className="text-3xl font-serif m-0">Service Disclaimers</h2>
                            </div>
                            <p>
                                Information regarding facilities and amenities is obtained from third-party travel dealers. While we strive for accuracy, we cannot guarantee that descriptions are always up-to-date. It is your responsibility to confirm specific requirements with us at the time of booking.
                            </p>
                        </div>

                        <div className="pt-12 border-t border-brand-charcoal/10 text-brand-charcoal/60 text-sm">
                            <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <p>Nilathra Hotel Management (Pvt) Ltd | Website Terms of Service</p>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
