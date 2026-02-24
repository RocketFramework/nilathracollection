// app/plans/page.tsx
import MainLayout from "@/components/layout/MainLayout";
import SuperLuxuryVIPPlan from "@/components/plans/SuperLuxuryVIPPlan";
import DeluxeCollectionPlan from "@/components/plans/DeluxeCollectionPlan";
import StandardPremiumPlan from "@/components/plans/StandardPremiumPlan";
import PlanComparison from "@/components/plans/PlanComparison";
import { Sparkles, Crown, Gem, Building } from "lucide-react";

export default function PlansPage() {
    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-neutral-50">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-xs uppercase tracking-widest font-semibold mb-4">
                            <Sparkles size={14} /> Curated Experiences
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-brand-green mb-4">
                            Choose Your Journey
                        </h1>
                        <p className="text-neutral-500 max-w-2xl mx-auto">
                            From ultra-luxury seclusion to refined comfort, select the experience that matches your vision of the perfect Sri Lankan adventure.
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="space-y-8 mb-16">
                        <SuperLuxuryVIPPlan />
                        <DeluxeCollectionPlan />
                        <StandardPremiumPlan />
                    </div>

                    {/* Comparison Table */}
                    <PlanComparison />

                    {/* FAQ Section */}
                    <div className="mt-16 bg-white rounded-3xl p-8 shadow-lg">
                        <h3 className="text-2xl font-serif text-brand-green mb-8 text-center">
                            Frequently Asked Questions
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2">Can I upgrade my plan?</h4>
                                <p className="text-sm text-neutral-600">
                                    Yes! You can upgrade at any time. The price difference will be calculated based on remaining nights.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2">Are flights included?</h4>
                                <p className="text-sm text-neutral-600">
                                    International flights are not included, but we can assist with booking at preferential rates.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2">What's the cancellation policy?</h4>
                                <p className="text-sm text-neutral-600">
                                    Free cancellation up to 30 days before arrival. VIP plan has extended flexibility.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2">Can I customize my itinerary?</h4>
                                <p className="text-sm text-neutral-600">
                                    Absolutely! Each plan serves as a foundation that we personalize based on your preferences.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-16 text-center">
                        <p className="text-neutral-500 mb-4">
                            Not sure which plan is right for you? Our travel specialists are here to help.
                        </p>
                        <button className="bg-brand-green text-white px-8 py-3 rounded-full text-sm uppercase tracking-wider font-semibold hover:bg-brand-charcoal transition-colors">
                            Schedule a Consultation
                        </button>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}