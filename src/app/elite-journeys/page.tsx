"use client";

import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect } from "react";

export default function EliteJourneysPage() {
    useEffect(() => {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // If it's a day card, stagger the timeline items inside
                    const timelineItems = entry.target.querySelectorAll('.reveal-item');
                    if (timelineItems.length > 0) {
                        timelineItems.forEach((item, index) => {
                            setTimeout(() => {
                                item.classList.add('visible');
                            }, 150 * index);
                        });
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });

        // Back to top button logic
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 500) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            });
        }
    }, []);

    return (
        <MainLayout>
            <style dangerouslySetInnerHTML={{ __html: `
                .ej-page {
                    --navy: #0C2340;
                    --gold: #C9A84C;
                    --ivory: #FAF8F4;
                    --text-dark: #1A1A1A;
                    --text-light: #555555;
                    font-family: 'Jost', sans-serif;
                    background-color: var(--ivory);
                    color: var(--text-dark);
                    line-height: 1.6;
                }
                .ej-page h1, .ej-page h2, .ej-page h3, .ej-page h4, .ej-page h5, .ej-page h6 {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 600;
                    color: var(--navy);
                }
                .ej-page a { text-decoration: none; color: inherit; }
                
                /* Hero Section */
                .ej-hero {
                    position: relative; height: 70vh; min-height: 500px;
                    background: url('https://images.unsplash.com/photo-1583037189850-1921be2077e6') center/cover;
                    display: flex; align-items: center; justify-content: center;
                    text-align: center; color: white;
                    border-radius: 2rem; overflow: hidden; margin-bottom: 4rem;
                }
                .ej-hero::before {
                    content: ''; position: absolute; inset: 0;
                    background-color: var(--navy); opacity: 0.65;
                }
                .ej-hero::after {
                    content: ''; position: absolute; inset: 0;
                    background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.08"/%3E%3C/svg%3E');
                    pointer-events: none;
                }
                .hero-content {
                    position: relative; z-index: 2; max-width: 800px; padding: 2rem;
                }
                .eyebrow {
                    font-size: 0.85rem; text-transform: uppercase; letter-spacing: 3px;
                    color: var(--gold); margin-bottom: 1rem; font-weight: 600;
                }
                .ej-hero h1 {
                    color: white; font-size: 4.5rem; margin-bottom: 1rem; line-height: 1.1;
                }
                .hero-sub {
                    font-size: 1.15rem; font-weight: 300; margin-bottom: 3rem; letter-spacing: 0.5px;
                }
                .stat-pills {
                    display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-bottom: 3rem;
                }
                .pill {
                    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15);
                    padding: 0.6rem 1.4rem; border-radius: 50px; font-size: 0.85rem; letter-spacing: 0.5px;
                    backdrop-filter: blur(8px);
                }
                .ej-btn {
                    display: inline-block; padding: 1rem 2.5rem;
                    background-color: var(--gold); color: var(--navy);
                    text-transform: uppercase; letter-spacing: 2px; font-size: 0.9rem;
                    font-weight: 600; border-radius: 2px; transition: all 0.3s; border: 1px solid var(--gold); cursor: pointer;
                }
                .ej-btn:hover { background-color: transparent; color: var(--gold); }
                
                /* Section Structure */
                .ej-section { padding: 4rem 0; max-width: 1100px; margin: 0 auto; }
                .section-title {
                    font-size: 2.8rem; text-align: center; margin-bottom: 4rem; position: relative;
                }
                .section-title::after {
                    content: ''; display: block; width: 40px; height: 2px;
                    background-color: var(--gold); margin: 1.5rem auto 0;
                }

                /* Journey Strip */
                .journey-strip {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    position: relative; margin-bottom: 5rem;
                }
                .journey-strip::before {
                    content: ''; position: absolute; top: 20px; left: 10%; right: 10%;
                    height: 1px; border-top: 1px dashed var(--gold); z-index: 1; opacity: 0.5;
                }
                .stop {
                    position: relative; z-index: 2; text-align: center; background: var(--ivory); padding: 0 1rem; width: 120px;
                }
                .stop-icon {
                    width: 40px; height: 40px; border-radius: 50%; background: var(--navy);
                    color: var(--gold); display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1rem; font-size: 1.2rem; font-family: 'Cormorant Garamond', serif; font-weight: 600;
                }
                .stop-name { font-weight: 600; font-size: 1.1rem; color: var(--navy); margin-bottom: 0.2rem; }
                .stop-nights { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; }

                /* Day Cards */
                .day-card {
                    display: flex; background: white; padding: 3rem; border-radius: 4px;
                    margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(12, 35, 64, 0.03); gap: 3rem;
                    opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out;
                }
                .day-card.visible { opacity: 1; transform: translateY(0); }
                .day-left { width: 100px; flex-shrink: 0; text-align: center; }
                .day-num { font-size: 3.5rem; font-family: 'Cormorant Garamond', serif; color: var(--navy); line-height: 1; margin-bottom: 0.5rem; }
                .day-date { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--gold); font-weight: 600; }
                .day-right { flex-grow: 1; }
                .day-header { border-bottom: 1px solid rgba(12, 35, 64, 0.1); padding-bottom: 1.5rem; margin-bottom: 2rem; }
                .day-title { font-size: 2rem; margin-bottom: 0.5rem; }
                .day-meta { font-size: 0.95rem; color: var(--text-light); }
                
                .timeline { position: relative; padding-left: 2rem; }
                .timeline::before { content: ''; position: absolute; left: 4px; top: 0; bottom: 0; width: 1px; background: rgba(12, 35, 64, 0.1); }
                .timeline-item { position: relative; margin-bottom: 2rem; opacity: 0; transform: translateX(-10px); transition: all 0.5s ease-out; }
                .timeline-item.visible { opacity: 1; transform: translateX(0); }
                .timeline-item:last-child { margin-bottom: 0; }
                .timeline-dot {
                    position: absolute; left: -2rem; top: 6px; width: 9px; height: 9px; border-radius: 50%;
                }
                .dot-blue { background: #4A90E2; }
                .dot-teal { background: #50E3C2; }
                .dot-amber { background: #F5A623; }
                .dot-green { background: #7ED321; }
                .dot-purple { background: #BD10E0; }
                .dot-coral { background: #FF6B6B; }
                
                .time { font-size: 0.8rem; font-weight: 600; color: var(--gold); margin-bottom: 0.3rem; letter-spacing: 1px; text-transform: uppercase; }
                .act-title { font-weight: 600; font-size: 1.15rem; margin-bottom: 0.3rem; color: var(--navy); }
                .act-desc { font-size: 0.95rem; color: var(--text-light); line-height: 1.5; max-width: 600px; }
                .ticket-pill {
                    display: inline-block; background: rgba(201, 168, 76, 0.08); color: var(--gold);
                    padding: 0.25rem 0.75rem; border-radius: 2px; font-size: 0.75rem; font-weight: 500;
                    margin-top: 0.75rem; border: 1px solid rgba(201, 168, 76, 0.2); letter-spacing: 0.5px;
                }

                /* Hotels */
                .hotel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem; }
                .hotel-card { background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(12, 35, 64, 0.03); opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; }
                .hotel-card.visible { opacity: 1; transform: translateY(0); }
                .hotel-img { height: 240px; background: #eee; background-size: cover; background-position: center; position: relative; }
                .hotel-body { padding: 2rem; }
                .hotel-stars { color: var(--gold); margin-bottom: 0.5rem; font-size: 0.85rem; letter-spacing: 2px; }
                .hotel-name { font-size: 1.75rem; margin-bottom: 0.2rem; }
                .hotel-loc { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-light); margin-bottom: 1.5rem; }
                .hotel-room { font-weight: 500; font-size: 1rem; margin-bottom: 0.2rem; color: var(--navy); }
                .hotel-rate { font-size: 0.85rem; color: var(--gold); font-weight: 600; margin-bottom: 1.5rem; }
                .hotel-bullets { list-style: none; font-size: 0.9rem; color: var(--text-light); padding: 0; }
                .hotel-bullets li { margin-bottom: 0.5rem; position: relative; padding-left: 1.2rem; line-height: 1.4; }
                .hotel-bullets li::before { content: '—'; position: absolute; left: 0; color: var(--gold); }

                /* Inclusions */
                .inclusions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; text-align: center; }
                .inc-item { padding: 2rem 1.5rem; background: white; border-radius: 4px; border: 1px solid rgba(12, 35, 64, 0.05); }
                .inc-icon { font-size: 1.8rem; margin-bottom: 1rem; color: var(--gold); font-family: 'Cormorant Garamond', serif; }
                .inc-text { font-size: 0.95rem; font-weight: 500; color: var(--navy); }

                /* Pricing */
                .pricing-table-container { background: white; padding: 3rem; border-radius: 4px; box-shadow: 0 4px 20px rgba(12, 35, 64, 0.03); }
                .pricing-table { width: 100%; border-collapse: collapse; }
                .pricing-table th, .pricing-table td { padding: 1.25rem 1rem; text-align: left; border-bottom: 1px solid rgba(12, 35, 64, 0.08); }
                .pricing-table th { color: var(--text-light); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid rgba(12, 35, 64, 0.1); }
                .pricing-table tr:last-child td { border-bottom: none; }
                .pricing-table td:first-child { font-weight: 500; color: var(--navy); }
                .pricing-table td:last-child { font-weight: 600; color: var(--navy); text-align: right; }
                .pricing-table td:nth-child(2) { color: var(--text-light); font-size: 0.9rem; }
                .total-row { background: var(--navy); }
                .total-row td { color: white !important; font-weight: 600 !important; font-size: 1.1rem; border: none; padding: 1.5rem 1rem; }
                .total-row td:last-child { color: var(--gold) !important; font-size: 1.3rem; }
                .price-note { font-size: 0.85rem; color: var(--text-light); text-align: center; margin-top: 2rem; font-style: italic; }

                /* Responsive */
                @media (max-width: 992px) {
                    .ej-hero h1 { font-size: 3.5rem; }
                    .journey-strip { overflow-x: auto; padding-bottom: 1rem; justify-content: flex-start; gap: 2rem; }
                    .journey-strip::before { min-width: 600px; }
                }
                @media (max-width: 768px) {
                    .ej-hero h1 { font-size: 2.8rem; }
                    .day-card { flex-direction: column; gap: 1.5rem; padding: 2rem; }
                    .day-left { text-align: left; width: 100%; border-bottom: 1px solid rgba(12, 35, 64, 0.1); padding-bottom: 1rem; }
                    .day-num { font-size: 2.5rem; display: inline-block; margin-right: 1rem; margin-bottom: 0; }
                    .day-date { display: inline-block; }
                    .pricing-table-container { padding: 1.5rem; }
                    .pricing-table th, .pricing-table td { padding: 1rem 0.5rem; font-size: 0.85rem; }
                }
            `}} />
            
            <div className="ej-page bg-[#FAF8F4] min-h-screen pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    {/* Back Link positioned above the hero to mimic luxury plan exactly */}
                    <Link href="/plans/luxury" className="inline-flex items-center gap-2 text-logo-blue hover:text-brand-gold transition-colors mb-8 font-medium">
                        <ArrowLeft size={16} /> Back to Luxury Plan
                    </Link>

                    <header className="ej-hero">
                        <div className="hero-content">
                            <div className="eyebrow">Signature Ceylon Experience</div>
                            <h1>Sri Lanka — 7 Nights / 8 Days</h1>
                            <p className="hero-sub">For 2 Guests · Colombo → Cultural Triangle → Kandy → Nuwara Eliya → Galle</p>
                            <div className="stat-pills">
                                <div className="pill">5 Signature Hotels</div>
                                <div className="pill">$10,392 Grand Total</div>
                                <div className="pill">HB + Lunch Daily</div>
                                <div className="pill">8 Days Chauffeured</div>
                            </div>
                            <Link href="/contact?plan=elite-journey&nights=8&travelers=2&budget=10400" className="ej-btn">Request This Journey</Link>
                        </div>
                    </header>

                    <section id="overview" className="ej-section">
                        <h2 className="section-title">Journey Overview</h2>
                        <div className="journey-strip">
                            <div className="stop">
                                <div className="stop-icon">1</div>
                                <div className="stop-name">Colombo</div>
                                <div className="stop-nights">2 Nights</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">2</div>
                                <div className="stop-name">Sigiriya</div>
                                <div className="stop-nights">2 Nights</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">3</div>
                                <div className="stop-name">Kandy</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">4</div>
                                <div className="stop-name">Nuwara Eliya</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">5</div>
                                <div className="stop-name">Galle</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                        </div>
                    </section>

                    <section id="itinerary" className="ej-section">
                        <h2 className="section-title">Day by Day</h2>

                        {/* Day 1 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">01</div>
                                <div className="day-date">Arrival</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Arrival, Colombo</h3>
                                    <div className="day-meta">Shangri-La Colombo · Deluxe Ocean View King · $224/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">On arrival</div>
                                        <div className="act-title">VIP airport meet & greet</div>
                                        <div className="act-desc">Priority immigration, premium SUV waiting.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">Transfer</div>
                                        <div className="act-title">45-min express to Shangri-La</div>
                                        <div className="act-desc">No delays, chilled towels in vehicle.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">CHI Spa Welcome Ritual</div>
                                        <div className="act-desc">Check-in, 60-min couples jet-lag recovery treatment.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB dinner at Capital Bar & Grill</div>
                                        <div className="act-desc">Exclusive dining experience at the hotel.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 2 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">02</div>
                                <div className="day-date">Colombo</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Colombo City Heritage</h3>
                                    <div className="day-meta">Shangri-La Colombo · $224/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Breakfast at Central restaurant (HB)</div>
                                        <div className="act-desc">A lavish spread to start your day.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">09:30</div>
                                        <div className="act-title">Private guided tour</div>
                                        <div className="act-desc">Dutch Hospital, Old Parliament, Gangaramaya Temple, Independence Square.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine dining lunch — Ministry of Crab</div>
                                        <div className="act-desc">Pre-reserved table.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">15:30</div>
                                        <div className="act-title">CHI Spa</div>
                                        <div className="act-desc">60-min aromatherapy massage + pool, steam & wellness lounge.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB dinner at Shang Palace</div>
                                        <div className="act-desc">Authentic cuisine within the resort.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 3 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">03</div>
                                <div className="day-date">Dambulla</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Colombo → Dambulla → Sigiriya</h3>
                                    <div className="day-meta">Jetwing Vil Uyana · Forest Dwelling Villa · $340/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Early breakfast + premium snack box in SUV</div>
                                        <div className="act-desc">Prepare for the scenic drive.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">11:00</div>
                                        <div className="act-title">Dambulla Royal Cave Temple</div>
                                        <div className="act-desc">5 caves, 157 Buddha statues, expert private guide.</div>
                                        <div className="ticket-pill">Entry: $10 × 2 = $20 incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">13:30</div>
                                        <div className="act-title">Curated fine lunch en route</div>
                                        <div className="act-desc">Premium local flavors.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">15:30</div>
                                        <div className="act-title">Check-in Jetwing Vil Uyana</div>
                                        <div className="act-desc">Butler assigned, wetland villa on stilts.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">17:00</div>
                                        <div className="act-title">Ayurvedic couples spa at Vil Uyana Spa</div>
                                        <div className="act-desc">Relaxation amidst nature.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB dinner at Apsara Restaurant</div>
                                        <div className="act-desc">Lakeside dining experience.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 4 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">04</div>
                                <div className="day-date">Sigiriya</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Sigiriya Rock & Minneriya Safari</h3>
                                    <div className="day-meta">Jetwing Vil Uyana · $340/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">05:30</div>
                                        <div className="act-title">Sunrise climb — Sigiriya Lion Rock (UNESCO)</div>
                                        <div className="act-desc">Expert guide, lion paws, frescoes, palace summit.</div>
                                        <div className="ticket-pill">Entry: $36 × 2 = $72 incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">Return breakfast at Vil Uyana (HB)</div>
                                        <div className="act-desc">Refresh after the morning hike.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine dining lunch + villa pool rest</div>
                                        <div className="act-desc">Relaxing afternoon in your private setting.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Minneriya National Park private jeep safari</div>
                                        <div className="act-desc">Witness &apos;The Gathering&apos; of wild elephants.</div>
                                        <div className="ticket-pill">Safari: $70 all-in incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">18:30</div>
                                        <div className="act-title">Evening spa</div>
                                        <div className="act-desc">Reflexology & hot stone massage.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB dinner</div>
                                        <div className="act-desc">Private starlit terrace dining.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 5 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">05</div>
                                <div className="day-date">Kandy</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Sigiriya → Kandy</h3>
                                    <div className="day-meta">Earl&apos;s Regency · Luxury King Room · $200/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">08:00</div>
                                        <div className="act-title">Breakfast & check-out</div>
                                        <div className="act-desc">Scenic drive through heartland.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">11:00</div>
                                        <div className="act-title">Temple of the Sacred Tooth Relic</div>
                                        <div className="act-desc">Expert private guide for the holy site.</div>
                                        <div className="ticket-pill">Entry: $6 × 2 = $12 incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">13:30</div>
                                        <div className="act-title">Fine dining lunch — The Empire Restaurant</div>
                                        <div className="act-desc">Premium dining in Kandy.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Check-in Earl&apos;s Regency</div>
                                        <div className="act-desc">Luxury King Room.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">16:00</div>
                                        <div className="act-title">Couples Ayurvedic massage</div>
                                        <div className="act-desc">At the hotel spa.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Kandyan Cultural Dance show</div>
                                        <div className="act-desc">Private seating followed by HB dinner.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 6 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">06</div>
                                <div className="day-date">N. Eliya</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Kandy → Nuwara Eliya</h3>
                                    <div className="day-meta">Heritance Tea Factory · Heritage Room · $175/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">08:00</div>
                                        <div className="act-title">Breakfast + Royal Botanical Gardens Peradeniya</div>
                                        <div className="act-desc">147 acres, giant fig trees, orchid house.</div>
                                        <div className="ticket-pill">Entry: $5 × 2 = $10 incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">10:30</div>
                                        <div className="act-title">Scenic mountain drive</div>
                                        <div className="act-desc">Stop at majestic Ramboda Falls.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine dining lunch — Grand Hotel Nuwara Eliya</div>
                                        <div className="act-desc">Colonial heritage dining experience.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Check-in Heritance Tea Factory</div>
                                        <div className="act-desc">Converted Victorian factory at 2,200m.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">16:30</div>
                                        <div className="act-title">Private tea estate walk</div>
                                        <div className="act-desc">Professional tasting ceremony.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Spa + fireplace dinner</div>
                                        <div className="act-desc">At The Pekoe restaurant.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 7 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">07</div>
                                <div className="day-date">Galle</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Nuwara Eliya → Galle</h3>
                                    <div className="day-meta">Amangalla, Galle Fort · Chamber · $700/night</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">05:30</div>
                                        <div className="act-title">Optional sunrise trek to Horton Plains</div>
                                        <div className="act-desc">World&apos;s End cliff at 870m.</div>
                                        <div className="ticket-pill">Entry: $25 × 2 = $50 incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">10:00</div>
                                        <div className="act-title">Breakfast & check-out</div>
                                        <div className="act-desc">4.5 hr coastal highway drive.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">14:00</div>
                                        <div className="act-title">Fine seafood lunch en route</div>
                                        <div className="act-desc">Fresh coastal dining.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">16:00</div>
                                        <div className="act-title">Check-in Amangalla, Galle Fort</div>
                                        <div className="act-desc">Chamber with four-poster bed, private garden.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">17:00</div>
                                        <div className="act-title">Amangalla Spa</div>
                                        <div className="act-desc">2-hour signature couples journey.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Guided sunset walk</div>
                                        <div className="act-desc">On Dutch fort ramparts + HB dinner.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day 8 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">08</div>
                                <div className="day-date">Departure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Galle & Departure</h3>
                                    <div className="day-meta">Transfer day</div>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">08:00</div>
                                        <div className="act-title">Final leisurely breakfast in Galle Fort (HB)</div>
                                        <div className="act-desc">Soak in the colonial atmosphere.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">Optional boutique shopping in the fort</div>
                                        <div className="act-desc">Antiques, tea, batik.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">11:00</div>
                                        <div className="act-title">Check-out, express coastal highway transfer</div>
                                        <div className="act-desc">To Colombo airport (~2.5 hrs).</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">En route</div>
                                        <div className="act-title">Farewell fine dining lunch stop in Bentota</div>
                                        <div className="act-desc">Last taste of Sri Lanka.</div>
                                        <div className="ticket-pill">$25/person incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">15:30+</div>
                                        <div className="act-title">VIP airport departure</div>
                                        <div className="act-desc">Check-in facilitation, lounge access, farewell gift.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="hotels" className="ej-section">
                        <h2 className="section-title">Signature Hotel Portfolio</h2>
                        <div className="hotel-grid">
                            <div className="hotel-card reveal">
                                {/* Replace the url below once you save the Shangri-La image to your public folder */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/shangri-la-colombo.jpg')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Shangri-La Colombo</h3>
                                    <div className="hotel-loc">Colombo</div>
                                    <div className="hotel-room">Deluxe Ocean View King</div>
                                    <div className="hotel-rate">$224 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Indian Ocean views, 541 rooms</li>
                                        <li>CHI Spa</li>
                                        <li>3 restaurants including Shang Palace</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="hotel-card reveal">
                                {/* Replace the url below once you save the Jetwing image to your public folder */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/jetwing-villuyana.jpg')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Jetwing Vil Uyana</h3>
                                    <div className="hotel-loc">Sigiriya</div>
                                    <div className="hotel-room">Forest Dwelling Villa</div>
                                    <div className="hotel-rate">$340 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Private wetland reserve</li>
                                        <li>Butler assigned</li>
                                        <li>Steps from Sigiriya, Ayurvedic spa</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="hotel-card reveal">
                                {/* Replace the url below once you save the Earl's Regency image to your public folder */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/eals-luxury-king.webp')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Earl&apos;s Regency</h3>
                                    <div className="hotel-loc">Kandy</div>
                                    <div className="hotel-room">Luxury King Room</div>
                                    <div className="hotel-rate">$200 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Set amid the misty mountains of Kandy</li>
                                        <li>Expansive free-form swimming pool</li>
                                        <li>Signature dining experiences</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="hotel-card reveal">
                                {/* Replace the url below once you save the Heritance Tea Factory image to your public folder */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/heritance-tea.webp')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Heritance Tea Factory</h3>
                                    <div className="hotel-loc">Kandapola</div>
                                    <div className="hotel-room">Heritage Room</div>
                                    <div className="hotel-rate">$175 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Converted Victorian tea factory at 2,200m</li>
                                        <li>On-site working tea estate</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="hotel-card reveal">
                                {/* Replace the url below once you save the Amangalla image to your public folder */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/amangalla-galle.jpg')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Amangalla</h3>
                                    <div className="hotel-loc">Galle Fort</div>
                                    <div className="hotel-room">Chamber</div>
                                    <div className="hotel-rate">$700 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Aman property inside 17th-century Dutch fort walls</li>
                                        <li>Colonial grandeur</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="transport" className="ej-section">
                        <h2 className="section-title">Your Private Transport</h2>
                        <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 md:p-12 rounded-xl shadow-[0_4px_20px_rgba(12,35,64,0.03)] border border-neutral-100 reveal">
                            <div className="w-full md:w-1/2 flex justify-center">
                                {/* Replace the src below once you save the Prado 150 image to your public folder */}
                                <img src="/images/elite-suv.png" alt="Toyota Prado 150" className="w-full max-w-md h-auto object-contain drop-shadow-2xl" />
                            </div>
                            <div className="w-full md:w-1/2">
                                <h3 className="text-3xl font-serif text-[#0C2340] mb-4">Toyota Prado 150</h3>
                                <p className="text-[#555555] mb-6 leading-relaxed">
                                    This rugged yet luxurious 4-wheel drive SUV is available from amongst our range of premium vehicles in Sri Lanka. Cruise in style with the versatile Toyota Prado 150. Experience the beautiful landscapes in absolute comfort with your dedicated, highly experienced English-speaking chauffeur.
                                </p>
                                <ul className="space-y-4 text-sm text-[#555555]">
                                    <li className="flex items-start gap-3"><Check size={18} className="text-[#C9A84C] mt-0.5" /> <span><strong>Spacious Luxury:</strong> Premium leather interior with dual-zone climate control and ample legroom.</span></li>
                                    <li className="flex items-start gap-3"><Check size={18} className="text-[#C9A84C] mt-0.5" /> <span><strong>Refreshments:</strong> Complimentary chilled bottled water and refreshing towels provided daily.</span></li>
                                    <li className="flex items-start gap-3"><Check size={18} className="text-[#C9A84C] mt-0.5" /> <span><strong>Connectivity:</strong> Onboard Wi-Fi enabled (subject to network coverage along the route).</span></li>
                                    <li className="flex items-start gap-3"><Check size={18} className="text-[#C9A84C] mt-0.5" /> <span><strong>Elite Chauffeur:</strong> 24/7 dedicated support from an expert local guide and precise logistics coordination.</span></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section id="inclusions" className="ej-section">
                        <h2 className="section-title">What&apos;s Included</h2>
                        <div className="inclusions-grid">
                            <div className="inc-item reveal">
                                <div className="inc-icon">🍽️</div>
                                <div className="inc-text">Half-board dining (breakfast + dinner)</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">🥂</div>
                                <div className="inc-text">Daily curated fine lunch</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">🚙</div>
                                <div className="inc-text">Premium SUV + chauffeur 8 days</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">💆</div>
                                <div className="inc-text">Daily couples spa</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">🎟️</div>
                                <div className="inc-text">All site entrance tickets</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">🧭</div>
                                <div className="inc-text">Private expert guides</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">📱</div>
                                <div className="inc-text">24/7 concierge</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">✈️</div>
                                <div className="inc-text">Express VIP airport transfers</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">📅</div>
                                <div className="inc-text">Pre-arranged reservations</div>
                            </div>
                            <div className="inc-item reveal">
                                <div className="inc-icon">🎁</div>
                                <div className="inc-text">Farewell gift</div>
                            </div>
                        </div>
                    </section>

                    <section id="pricing" className="ej-section">
                        <h2 className="section-title">Pricing Breakdown</h2>
                        
                        <div className="max-w-4xl mx-auto mb-8 bg-[#C9A84C]/10 border border-[#C9A84C]/20 p-5 rounded-lg text-sm text-[#0C2340] leading-relaxed text-center reveal">
                            <strong>Pricing Transparency Note:</strong> The cost values below are actual costs sourced directly from each service provider as of <strong>April 21st, 2026</strong>. These values may vary depending on your specific choices, preferences, and travel dates. We are committed to complete transparency and will always show you the actual costs.
                        </div>

                        <div className="pricing-table-container reveal">
                            <table className="pricing-table">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Calculation</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Signature Resorts & Hotels (HB)</td>
                                        <td>10% Service Fee inclusive Room/BB ($2,819) + HB Supplement (~$700)</td>
                                        <td>$3,519</td>
                                    </tr>
                                    <tr>
                                        <td>Premium SUV, Fuel & Driver</td>
                                        <td>$150 × 8 days</td>
                                        <td>$1,200</td>
                                    </tr>
                                    <tr>
                                        <td>Curated Fine Dining Lunches</td>
                                        <td>$25 × 2 persons × 8 days</td>
                                        <td>$400</td>
                                    </tr>
                                    <tr>
                                        <td>Daily Wellness & Spa</td>
                                        <td>$100 × 2 persons × 7 nights</td>
                                        <td>$1,400</td>
                                    </tr>
                                    <tr>
                                        <td>Elite Guides & Site Access</td>
                                        <td>$40 × 8 days</td>
                                        <td>$320</td>
                                    </tr>
                                    <tr>
                                        <td>Invisible Concierge & Precision Logistics</td>
                                        <td>Seamless transfers, 24/7 support</td>
                                        <td>$500</td>
                                    </tr>
                                    <tr style={{ backgroundColor: 'rgba(12, 35, 64, 0.03)' }}>
                                        <td style={{ fontWeight: 600 }}>Total Base Cost</td>
                                        <td>Sum of all journey components</td>
                                        <td style={{ fontWeight: 600 }}>$7,339</td>
                                    </tr>
                                    <tr>
                                        <td>Agency Planning & Service Fee</td>
                                        <td>20% of Total Base Cost</td>
                                        <td>$1,468</td>
                                    </tr>
                                    <tr style={{ backgroundColor: 'rgba(12, 35, 64, 0.03)' }}>
                                        <td style={{ fontWeight: 600 }}>Gross Total</td>
                                        <td>Total Base Cost + Agency Fee</td>
                                        <td style={{ fontWeight: 600 }}>$8,807</td>
                                    </tr>
                                    <tr>
                                        <td>Government Tax</td>
                                        <td>18% VAT applied to Gross Total</td>
                                        <td>$1,585</td>
                                    </tr>
                                    <tr className="total-row">
                                        <td>Estimated Grand Total</td>
                                        <td>2 Persons · 7 Nights</td>
                                        <td>$10,392</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="price-note">Rates are indicative for 2025/2026 season. Peak season (Dec–Mar) may vary.<br />All site entrance fees are included within the Elite Guides & Logistics budget.</p>
                        </div>
                    </section>
                </div>
            </div>
            
            <div className="back-to-top" id="backToTop" onClick={() => window.scrollTo(0,0)}>↑</div>
        </MainLayout>
    );
}
