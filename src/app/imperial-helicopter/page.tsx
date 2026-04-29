"use client";

import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect } from "react";

export default function ImperialHelicopterPage() {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
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
                    --navy: #0D1B2A;
                    --gold: #C9A96E;
                    --ivory: #F5F0E8;
                    --copper: #A0522D;
                    --green: #1B3A2D;
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
                    position: relative; min-height: 70vh; padding: 4rem 1rem;
                    /* [HERO: Private helicopter banking over Sri Lanka misty tea terraces at dawn, Castlereagh Lake below, golden light] */
                    background: url('https://images.unsplash.com/photo-1580915411954-282cb1b0d780?q=80') center/cover;
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
                    margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(13, 27, 42, 0.04); gap: 3rem;
                    opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out;
                }
                .day-card.visible { opacity: 1; transform: translateY(0); }
                .day-left { width: 100px; flex-shrink: 0; text-align: center; }
                .day-num { font-size: 3.5rem; font-family: 'Cormorant Garamond', serif; color: var(--navy); line-height: 1; margin-bottom: 0.5rem; }
                .day-date { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--gold); font-weight: 600; }
                .day-right { flex-grow: 1; }
                .day-header { border-bottom: 1px solid rgba(13, 27, 42, 0.1); padding-bottom: 1.5rem; margin-bottom: 2rem; }
                .day-title { font-size: 2rem; margin-bottom: 0.5rem; }
                .day-meta { font-size: 0.95rem; color: var(--text-light); }
                
                .timeline { position: relative; padding-left: 2rem; }
                .timeline::before { content: ''; position: absolute; left: 4px; top: 0; bottom: 0; width: 1px; background: rgba(13, 27, 42, 0.1); }
                .timeline-item { position: relative; margin-bottom: 2rem; opacity: 0; transform: translateX(-10px); transition: all 0.5s ease-out; }
                .timeline-item.visible { opacity: 1; transform: translateX(0); }
                .timeline-item:last-child { margin-bottom: 0; }
                .timeline-dot {
                    position: absolute; left: -2rem; top: 6px; width: 9px; height: 9px; border-radius: 50%;
                }
                .dot-blue { background: #4A90E2; }
                .dot-teal { background: #50E3C2; }
                .dot-amber { background: var(--gold); }
                .dot-green { background: var(--green); }
                .dot-purple { background: #BD10E0; }
                .dot-copper { background: var(--copper); }
                
                .time { font-size: 0.8rem; font-weight: 600; color: var(--gold); margin-bottom: 0.3rem; letter-spacing: 1px; text-transform: uppercase; }
                .act-title { font-weight: 600; font-size: 1.15rem; margin-bottom: 0.3rem; color: var(--navy); }
                .act-desc { font-size: 0.95rem; color: var(--text-light); line-height: 1.5; max-width: 600px; }
                .ticket-pill {
                    display: inline-block; background: rgba(201, 169, 110, 0.08); color: var(--gold);
                    padding: 0.25rem 0.75rem; border-radius: 2px; font-size: 0.75rem; font-weight: 500;
                    margin-top: 0.75rem; border: 1px solid rgba(201, 169, 110, 0.2); letter-spacing: 0.5px;
                }
                .heli-pill {
                    display: inline-block; background: rgba(13, 27, 42, 0.05); color: var(--navy);
                    padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;
                    margin-top: 0.75rem; border: 1px solid rgba(13, 27, 42, 0.15); letter-spacing: 0.5px;
                }

                /* Hotels */
                .hotel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem; }
                .hotel-card { background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(13, 27, 42, 0.04); opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; }
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

                /* Transport */
                .transport-section { background: white; padding: 3rem; border-radius: 4px; box-shadow: 0 4px 20px rgba(13, 27, 42, 0.04); margin-bottom: 4rem; }
                .transport-title { font-size: 1.8rem; margin-bottom: 1rem; }
                .transport-subtitle { font-weight: 600; color: var(--navy); margin-bottom: 0.5rem; }
                .transport-list { list-style: none; font-size: 0.95rem; color: var(--text-light); padding: 0; margin-bottom: 1.5rem; }
                .transport-list li { margin-bottom: 0.5rem; position: relative; padding-left: 1.2rem; line-height: 1.4; }
                .transport-list li::before { content: '•'; position: absolute; left: 0; color: var(--gold); }
                .transport-meta { font-size: 0.9rem; color: var(--navy); font-weight: 500; }

                /* Inclusions */
                .inclusions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; text-align: left; }
                .inc-item { padding: 1.5rem; background: white; border-radius: 4px; border: 1px solid rgba(13, 27, 42, 0.05); display: flex; gap: 1rem; align-items: flex-start; }
                .inc-icon { font-size: 1.5rem; color: var(--gold); }
                .inc-text { font-size: 0.95rem; font-weight: 500; color: var(--navy); line-height: 1.4; }

                /* Pricing */
                .pricing-table-container { background: white; padding: 3rem; border-radius: 4px; box-shadow: 0 4px 20px rgba(13, 27, 42, 0.04); }
                .pricing-table { width: 100%; border-collapse: collapse; }
                .pricing-table th, .pricing-table td { padding: 1.25rem 1rem; text-align: left; border-bottom: 1px solid rgba(13, 27, 42, 0.08); }
                .pricing-table th { color: var(--text-light); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid rgba(13, 27, 42, 0.1); }
                .pricing-table tr:last-child td { border-bottom: none; }
                .pricing-table td:first-child { font-weight: 500; color: var(--navy); }
                .pricing-table td:last-child { font-weight: 600; color: var(--navy); text-align: right; }
                .pricing-table td:nth-child(2) { color: var(--text-light); font-size: 0.9rem; }
                .total-row { background: var(--navy); }
                .total-row td { color: white !important; font-weight: 600 !important; font-size: 1.1rem; border: none; padding: 1.5rem 1rem; }
                .total-row td:last-child { color: var(--gold) !important; font-size: 1.3rem; }
                .price-note { font-size: 0.85rem; color: var(--text-light); margin-top: 2rem; font-style: italic; line-height: 1.6; border-left: 3px solid var(--gold); padding-left: 1rem; }

                /* Responsive */
                @media (max-width: 992px) {
                    .ej-hero h1 { font-size: 3.5rem; }
                    .journey-strip { overflow-x: auto; padding-bottom: 1rem; justify-content: flex-start; gap: 2rem; }
                    .journey-strip::before { min-width: 600px; }
                }
                @media (max-width: 768px) {
                    .ej-hero h1 { font-size: 2.8rem; }
                    .day-card { flex-direction: column; gap: 1.5rem; padding: 2rem; }
                    .day-left { text-align: left; width: 100%; border-bottom: 1px solid rgba(13, 27, 42, 0.1); padding-bottom: 1rem; }
                    .day-num { font-size: 2.5rem; display: inline-block; margin-right: 1rem; margin-bottom: 0; }
                    .day-date { display: inline-block; }
                    .pricing-table-container { padding: 1.5rem; }
                    .pricing-table th, .pricing-table td { padding: 1rem 0.5rem; font-size: 0.85rem; }
                    .inc-item { flex-direction: column; text-align: center; align-items: center; }
                }
            `}} />
            
            <div className="ej-page bg-[#F5F0E8] min-h-screen pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    {/* Back Link */}
                    <Link href="/plans/luxury" className="inline-flex items-center gap-2 text-logo-blue hover:text-brand-gold transition-colors mb-8 font-medium">
                        <ArrowLeft size={16} /> Back to Luxury Plan
                    </Link>

                    <header className="ej-hero">
                        <div className="hero-content">
                            <div className="eyebrow">The Imperial Helicopter Route</div>
                            <h1>5 Nights / 6 Days</h1>
                            <p className="hero-sub">For 4 Travelers · Colombo → Kandy → Tea Country → Weligama → South Coast</p>
                            
                            <div className="stat-pills">
                                <span className="pill">Charter Helicopter Across the Island</span>
                                <span className="pill">Ceylon Tea Trails Master Suite</span>
                                <span className="pill">Private Chef Dining</span>
                                <span className="pill">Private Catamaran</span>
                                <span className="pill">Cape Weligama</span>
                                <span className="pill">Exclusive Estate Access</span>
                            </div>
                            
                            <div className="mb-8">
                                <div className="text-white text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">$48,000 Grand Total</div>
                                <div className="text-4xl md:text-5xl font-serif font-bold text-brand-gold">$2,000 per person / day</div>
                            </div>

                            <Link href="/contact?plan=imperial-helicopter&nights=6&travelers=4&budget=48000" className="ej-btn">Request This Journey</Link>
                        </div>
                    </header>

                    <section className="ej-section">
                        <div className="journey-strip">
                            <div className="stop">
                                <div className="stop-icon">1</div>
                                <div className="stop-name">Colombo</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">2</div>
                                <div className="stop-name">Kandy</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">3</div>
                                <div className="stop-name">Tea Trails</div>
                                <div className="stop-nights">2 Nights</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">4</div>
                                <div className="stop-name">Weligama</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">5</div>
                                <div className="stop-name">South Coast</div>
                                <div className="stop-nights">1 Night</div>
                            </div>
                        </div>

                        {/* DAY 01 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">01</div>
                                <div className="day-date">Arrival</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Arrival · Colombo</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Shangri-La Colombo · Grand Suite · $520/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">On arrival</div>
                                        <div className="act-title">VIP airport meet & greet</div>
                                        <div className="act-desc">Priority immigration, dedicated ground handler, champagne-stocked Range Rover waiting.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">Transfer</div>
                                        <div className="act-title">45-min express to Shangri-La</div>
                                        <div className="act-desc">Seamless Colombo arrival — your private butler already at the suite.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">Grand Suite check-in + CHI Spa</div>
                                        <div className="act-desc">Personal welcome, 90-min couples deep-tissue recovery treatment for all 4 guests.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">19:00</div>
                                        <div className="act-title">Welcome dinner — Capital Bar & Grill</div>
                                        <div className="act-desc">Private reserved table, bespoke tasting menu, champagne on arrival. HB incl.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 02 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">02</div>
                                <div className="day-date">Transfer</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Colombo → Kandy · Helicopter Transfer #1</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Mahaweli Reach Hotel · One Bedroom Executive · $180/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Early breakfast at Shangri-La (HB)</div>
                                        <div className="act-desc">Private dining room set for the group.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-copper"></div>
                                        <div className="time">08:30</div>
                                        <div className="act-title">🚁 Helicopter Transfer — Colombo → Kandy</div>
                                        <div className="act-desc">Air Senok / IWS Aviation private charter. Airbus AS350 or EC130 — Lamborghini leather seats, glass cockpit, fully air-conditioned. Departs Colombo (Ratmalana). Approx. 45 minutes.<br/><span className="heli-pill">USD $2,000/hour · est. $1,500 per transfer</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">10:00</div>
                                        <div className="act-title">Arrive Kandy · Temple of the Sacred Tooth Relic</div>
                                        <div className="act-desc">Private guide + exclusive early-morning access before public hours. <span className="ticket-pill">Entry: $6 × 4 = $24 incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine dining lunch — The Empire Restaurant</div>
                                        <div className="act-desc">Pre-reserved private dining room. <span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Check-in Mahaweli Reach Hotel</div>
                                        <div className="act-desc">One Bedroom Executive. Set on the banks of the Mahaweli River with sweeping Kandy valley views.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">16:00</div>
                                        <div className="act-title">Royal Botanical Gardens, Peradeniya</div>
                                        <div className="act-desc">Private after-hours guided walk through 147 acres — giant fig trees, the spice collection, Queen's Orchid House. <span className="ticket-pill">Entry: $5 × 4 = $20 incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Kandyan Cultural Dance show — private seating</div>
                                        <div className="act-desc">Followed by HB dinner on the terrace overlooking the illuminated valley.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 03 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">03</div>
                                <div className="day-date">Tea Country</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Kandy → Tea Country · Helicopter Transfer #2</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Ceylon Tea Trails — Castlereagh Bungalow · Master Suite · $1,040/night (all-inclusive)</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Breakfast at Mahaweli Reach Hotel (HB)</div>
                                        <div className="act-desc"></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-copper"></div>
                                        <div className="time">08:30</div>
                                        <div className="act-title">🚁 Helicopter Transfer — Kandy → Tea Trails</div>
                                        <div className="act-desc">Private charter, Air Senok / IWS Aviation. Approx. 30 minutes over jade-green hill country — the most beautiful flight in Sri Lanka. Land directly at the Castlereagh Reservoir seaplane base.<br/><span className="heli-pill">USD $2,000/hour · est. $1,000 per transfer</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">09:30</div>
                                        <div className="act-title">Check-in Ceylon Tea Trails — Castlereagh Bungalow</div>
                                        <div className="act-desc">★★★★★ Relais & Châteaux — 3 Michelin Keys (2025). Your private colonial bungalow on the edge of Castlereagh Lake. Butler, resident chef, and house team entirely dedicated to your group.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">12:00</div>
                                        <div className="act-title">👨🍳 Private Chef Dining — Lakeside Lunch</div>
                                        <div className="act-desc">Your dedicated bungalow chef prepares a curated Sri Lankan tasting menu at the lakeside summerhouse. Silver service, fresh estate produce. Incl. in bungalow rate.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Private tea estate walk + Master Tasting</div>
                                        <div className="act-desc">Guided walk through 3,500 acres of tea terraces with the estate's resident tea sommelier. End at the Dunkeld factory. Private tasting ceremony — 12 single-estate teas.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">17:30</div>
                                        <div className="act-title">Castlereagh Lake sunset — private boat</div>
                                        <div className="act-desc">Gentle rowboat out onto the glass-flat lake as dusk falls over the hills.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">👨🍳 Private Chef Dining — Four-Course Estate Dinner</div>
                                        <div className="act-desc">Candlelit dining room, four-course dinner with wine pairings. Your bungalow chef's signature Sri Lankan-European fusion. Incl. in bungalow rate.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 04 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">04</div>
                                <div className="day-date">Immersion</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Tea Country · Full Immersion Day</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Ceylon Tea Trails — Castlereagh Bungalow · Master Suite · $1,040/night (all-inclusive)</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">06:30</div>
                                        <div className="act-title">Dawn mist walk on the Peak Ridge</div>
                                        <div className="act-desc">Private guided trail through the estate's highest tea terraces at sunrise — extraordinary light, total silence.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">08:30</div>
                                        <div className="act-title">Alfresco breakfast in the bungalow garden (incl.)</div>
                                        <div className="act-desc">Tea plantation panorama.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">10:00</div>
                                        <div className="act-title">Adam's Peak (Sri Pada) / Castlereagh Fishing</div>
                                        <div className="act-desc">Optional pilgrimage hike OR Bamboo rod fishing from the bungalow jetty, guided by the estate team. Incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">👨🍳 Private Chef Dining — Garden Picnic Lunch</div>
                                        <div className="act-desc">Chef prepares a picnic spread served on the estate lawns above the lake. Artisan bread, charcuterie, local cheeses, fresh fruit. Incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Spa afternoon — in-bungalow treatments</div>
                                        <div className="act-desc">Massage therapists brought to the bungalow. Four individual treatments simultaneously. 90 min each. <span className="ticket-pill">$150/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-copper"></div>
                                        <div className="time">17:00</div>
                                        <div className="act-title">Private batik workshop with local artisan</div>
                                        <div className="act-desc">Hand-print your own piece — an intimate craft session at the bungalow. Incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">👨🍳 Private Chef Dining — Estate Farewell Dinner</div>
                                        <div className="act-desc">Special menu curated by the chef. Your last evening in the clouds. Champagne under the stars. Incl. in bungalow rate.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 05 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">05</div>
                                <div className="day-date">Transfer</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Tea Country → Weligama · Helicopter Transfer #3</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Cape Weligama · Premier Ocean Villa · Weligama · $1,200/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:30</div>
                                        <div className="act-title">Final dawn breakfast at Castlereagh (incl.)</div>
                                        <div className="act-desc">One last view over the reservoir.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-copper"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">🚁 Helicopter Transfer — Tea Trails → Weligama</div>
                                        <div className="act-desc">The most dramatic transfer of the journey — from misty highland plantations to sun-drenched southern coast in under an hour. Air Senok / IWS Aviation private charter. Approx. 1 hour.<br/><span className="heli-pill">USD $2,000/hour · est. $2,000 per transfer</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">10:30</div>
                                        <div className="act-title">Check-in Cape Weligama</div>
                                        <div className="act-desc">Resplendent Ceylon property set on a soaring clifftop with panoramic Indian Ocean views. Premier Ocean Villa with private garden and butler assigned.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">12:00</div>
                                        <div className="act-title">Fine seafood lunch — Ocean Terrace</div>
                                        <div className="act-desc">Private table, Indian Ocean views. <span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-green"></div>
                                        <div className="time">14:00</div>
                                        <div className="act-title">Afternoon at the Cove Pool or Surfing</div>
                                        <div className="act-desc">Relax by the cliff-edge infinity pool or enjoy a private surf lesson at Weligama bay.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">16:00</div>
                                        <div className="act-title">Sanctuary Spa Treatment</div>
                                        <div className="act-desc">In-villa spa treatment using bespoke Ceylon tea-based products. 2-hour signature treatment for all 4 guests. <span className="ticket-pill">$200/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Sunset at the Cliff Edge</div>
                                        <div className="act-desc">Champagne on the cliffs as the Indian Ocean catches the last light. HB dinner at the Ocean Grill.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 06 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">06</div>
                                <div className="day-date">Departure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Weligama · Private Catamaran + Departure</h3>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:30</div>
                                        <div className="act-title">Final breakfast, Cape Weligama (HB)</div>
                                        <div className="act-desc"></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">⛵ Private Catamaran — Full-Day Indian Ocean Charter</div>
                                        <div className="act-desc">Exclusive use of a private crewed luxury catamaran departing Mirissa Harbour. Sail the southern coastline — snorkelling at reef spots, dolphin and whale spotting, fresh seafood lunch prepared onboard by the vessel's chef, sunset cocktails on the foredeck. All 4 guests exclusive.<br/><span className="ticket-pill">Total incl.: $1,500</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">16:00</div>
                                        <div className="act-title">Return to Cape Weligama · check-out</div>
                                        <div className="act-desc"></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-copper"></div>
                                        <div className="time">17:00</div>
                                        <div className="act-title">🚁 Helicopter Transfer — Weligama → Colombo BIA</div>
                                        <div className="act-desc">Final flight home. Air Senok private charter from the southern coast. Approx. 45 minutes.<br/><span className="heli-pill">USD $2,000/hour · est. $1,500 per transfer</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">En route</div>
                                        <div className="act-title">VIP departure lounge — Bandaranaike International</div>
                                        <div className="act-desc">Private check-in facilitation, premium lounge access, farewell gift.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </section>

                    <section className="ej-section reveal">
                        <h2 className="section-title">Signature Property Portfolio</h2>
                        <div className="hotel-grid">
                            <div className="hotel-card reveal">
                                {/* [HERO: Shangri-La Colombo Grand Suite] */}
                                <div className="hotel-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Shangri-La Colombo</h3>
                                    <div className="hotel-loc">Colombo</div>
                                    <div className="hotel-room">Grand Suite</div>
                                    <div className="hotel-rate">$520 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Indian Ocean panoramic views, 541 rooms</li>
                                        <li>CHI Spa — jet-lag recovery ritual on arrival</li>
                                        <li>Capital Bar & Grill private dining</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="hotel-card reveal">
                                {/* [Mahaweli Reach Hotel Kandy] */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/mawelireach.webp')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★</div>
                                    <h3 className="hotel-name">Mahaweli Reach Hotel</h3>
                                    <div className="hotel-loc">Kandy</div>
                                    <div className="hotel-room">One Bedroom Executive</div>
                                    <div className="hotel-rate">$180 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Set on the banks of the Mahaweli River with panoramic valley views</li>
                                        <li>Outdoor pool and full-service spa overlooking the hills</li>
                                        <li>Walking distance to the Temple of the Sacred Tooth Relic</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hotel-card reveal">
                                {/* [Ceylon Tea Trails Castlereagh Bungalow exterior — colonial veranda, lake view, mist rising] */}
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/castlereach.webp')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Ceylon Tea Trails — Castlereagh Bungalow</h3>
                                    <div className="hotel-loc">Hatton (Relais & Châteaux · 3 Michelin Keys 2025)</div>
                                    <div className="hotel-room">Master Suite</div>
                                    <div className="hotel-rate">$1,040 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Private colonial bungalow on Castlereagh Lake — your own dedicated chef, butler & house team</li>
                                        <li>3,500 acres of working tea estate — estate walks, tasting ceremonies, lake activities</li>
                                        <li>Part of the Resplendent Ceylon "Route de Bonheur"</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="hotel-card reveal">
                                {/* [Cape Weligama infinity pool over Indian Ocean or Premier Ocean Villa] */}
                                <div className="hotel-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Cape Weligama</h3>
                                    <div className="hotel-loc">Weligama (Relais & Châteaux)</div>
                                    <div className="hotel-room">Premier Ocean Villa</div>
                                    <div className="hotel-rate">$1,200 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Perched on a soaring clifftop with panoramic Indian Ocean views</li>
                                        <li>Resplendent Ceylon property with Moon Pool and Cove Pool</li>
                                        <li>In-villa spa treatments and world-class culinary experiences</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="ej-section reveal">
                        <div className="transport-section">
                            <h2 className="transport-title">Your Private Transport</h2>
                            <div className="transport-subtitle">Charter Helicopter — Air Senok / IWS Aviation</div>
                            <ul className="transport-list">
                                <li>Airbus AS350 B3 / Airbus EC130 B4</li>
                                <li>Lamborghini-designed leather upholstered seating, glass cockpit</li>
                                <li>Fully air-conditioned, accommodates 4 passengers + pilot</li>
                                <li>Operated by Sri Lanka's premier civil aviation providers</li>
                            </ul>
                            <div className="transport-meta mb-6">
                                <p><strong>Rate:</strong> USD $2,000/hour (chartered rate)<br/>
                                <strong>Service hours:</strong> 06:30–18:00 daily (weather dependent)<br/>
                                <strong>Operators:</strong> Air Senok (airsenok.lk) · IWS Aviation (iwsaviation.com)</p>
                            </div>
                            
                            <div className="transport-subtitle mt-6">Total helicopter flight time: ~3 hours across 4 transfers</div>
                            <p className="text-sm text-neutral-600 mb-6">Colombo→Kandy (45min) · Kandy→Tea Trails (30min) · Tea Trails→Weligama (60min) · Weligama→Colombo (45min)</p>
                            
                            <div className="transport-subtitle mt-6">Plus: Range Rover ground fleet</div>
                            <p className="text-sm text-neutral-600">For all inter-destination transfers and excursion days. Dedicated driver-guide assigned to the group throughout.</p>
                        </div>
                    </section>

                    <section className="ej-section reveal">
                        <h2 className="section-title">What's Included</h2>
                        <div className="inclusions-grid">
                            <div className="inc-item">
                                <div className="inc-icon">🚁</div>
                                <div className="inc-text">Full charter helicopter transfers — 4 sectors (~3 hrs · Air Senok / IWS Aviation)</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🍽️</div>
                                <div className="inc-text">Half-board dining + all-inclusive at Tea Trails (breakfast, lunch, dinner, spirits)</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">👨‍🍳</div>
                                <div className="inc-text">Private chef dining — 3 dedicated meals at Ceylon Tea Trails bungalow</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">⛵</div>
                                <div className="inc-text">Full-day private catamaran — exclusive charter, crew & onboard chef</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🥂</div>
                                <div className="inc-text">Daily curated fine lunch ($25/person)</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🚙</div>
                                <div className="inc-text">Range Rover fleet + dedicated chauffeur-guide 6 days</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">💆</div>
                                <div className="inc-text">Daily couples spa / in-bungalow wellness treatments</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🎟️</div>
                                <div className="inc-text">All site entrance tickets</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🧭</div>
                                <div className="inc-text">Private expert guide throughout</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">📱</div>
                                <div className="inc-text">24/7 personal concierge</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">✈️</div>
                                <div className="inc-text">Express VIP airport transfers (arrival + departure)</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🎁</div>
                                <div className="inc-text">Farewell gift</div>
                            </div>
                        </div>
                    </section>

                    <section className="ej-section reveal">
                        <h2 className="section-title">Pricing Breakdown</h2>
                        <div className="pricing-table-container overflow-x-auto">
                            <table className="pricing-table min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Calculation</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Shangri-La Colombo — Grand Suite</td>
                                        <td>$520 × 2 rooms × 1 night</td>
                                        <td>$1,040</td>
                                    </tr>
                                    <tr>
                                        <td>Mahaweli Reach Hotel Kandy — One Bedroom Executive</td>
                                        <td>$180 × 2 rooms × 1 night</td>
                                        <td>$360</td>
                                    </tr>
                                    <tr>
                                        <td>Ceylon Tea Trails — Castlereagh Master Suites</td>
                                        <td>$1,040 × 2 suites × 2 nights (meals, drinks, butler, laundry incl.)</td>
                                        <td>$4,160</td>
                                    </tr>
                                    <tr>
                                        <td>Cape Weligama — Premier Ocean Villa</td>
                                        <td>$1,200 × 2 villas × 1 night</td>
                                        <td>$2,400</td>
                                    </tr>
                                    <tr>
                                        <td>Charter Helicopter — Air Senok / IWS Aviation</td>
                                        <td>$2,000/hr × ~3 hrs total (4 sectors: 45+30+60+45 min)</td>
                                        <td>$6,000</td>
                                    </tr>
                                    <tr>
                                        <td>Private Catamaran Charter — Full Day</td>
                                        <td>Exclusive charter, crew & onboard chef, Galle</td>
                                        <td>$1,500</td>
                                    </tr>
                                    <tr>
                                        <td>Premium Range Rover Fleet + Chauffeur-Guide</td>
                                        <td>$200 × 6 days</td>
                                        <td>$1,200</td>
                                    </tr>
                                    <tr>
                                        <td>Curated Fine Dining Lunches (non-Tea Trails days)</td>
                                        <td>$25 × 4 persons × 4 days</td>
                                        <td>$400</td>
                                    </tr>
                                    <tr>
                                        <td>Daily Wellness & Spa (all 4 guests)</td>
                                        <td>$150 × 4 persons × 5 nights</td>
                                        <td>$3,000</td>
                                    </tr>
                                    <tr>
                                        <td>Cape Weligama Sanctuary Spa (Day 5)</td>
                                        <td>$200 × 4 persons</td>
                                        <td>$800</td>
                                    </tr>
                                    <tr>
                                        <td>Elite Naturalist / Expert Guides & Site Access</td>
                                        <td>$50 × 6 days</td>
                                        <td>$300</td>
                                    </tr>
                                    <tr>
                                        <td>Private Chef Supplement (Tea Trails beyond standard)</td>
                                        <td>Included in Tea Trails all-inclusive rate</td>
                                        <td>$0</td>
                                    </tr>
                                    <tr>
                                        <td>Invisible Concierge & Precision Logistics</td>
                                        <td>VIP airport handling, 24/7 support, pre-arranged reservations</td>
                                        <td>$700</td>
                                    </tr>
                                    <tr style={{ background: 'rgba(13, 27, 42, 0.03)' }}>
                                        <td style={{ fontWeight: 600 }}>Total Base Cost</td>
                                        <td>Sum of all journey components</td>
                                        <td style={{ fontWeight: 600 }}>$21,860</td>
                                    </tr>
                                    <tr>
                                        <td>Agency Planning & Service Fee</td>
                                        <td>20% of Total Base Cost</td>
                                        <td>$4,372</td>
                                    </tr>
                                    <tr style={{ background: 'rgba(13, 27, 42, 0.03)' }}>
                                        <td style={{ fontWeight: 600 }}>Gross Total</td>
                                        <td>Total Base Cost + Agency Fee</td>
                                        <td style={{ fontWeight: 600 }}>$26,232</td>
                                    </tr>
                                    <tr>
                                        <td>Government Tax</td>
                                        <td>18% VAT applied to Gross Total</td>
                                        <td>$4,722</td>
                                    </tr>
                                    <tr className="total-row" style={{ background: 'var(--copper)' }}>
                                        <td>Estimated Base Grand Total</td>
                                        <td>4 Persons · 5 Nights · 6 Days</td>
                                        <td>$30,954</td>
                                    </tr>
                                    <tr className="total-row">
                                        <td>Imperial Package Rate</td>
                                        <td style={{ fontWeight: 'normal', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Peak-season guarantee, priority helicopter allocation, exclusive property hold & concierge buffer</td>
                                        <td>$48,000</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <p className="price-note">
                                <strong>Pricing Transparency Note:</strong> The cost values above are actual costs sourced directly from each service provider as of April 21st, 2026. These values may vary depending on your specific choices, preferences, and travel dates. We are committed to complete transparency and will always show you the actual costs.<br/><br/>
                                <em>Rates are indicative for the 2025/2026 season. Helicopter rate fixed at USD $2,000/hour as quoted. Ceylon Tea Trails Master Suite rate from resplendentceylon.com and Mr & Mrs Smith (from ~$1,040/night per suite). Cape Weligama rate from resplendentceylon.com ($1,200/night with taxes). Catamaran rate sourced from sailo.com (~$1,100–$1,500/day for private full charter in Sri Lanka). All site entrance fees are included. The $48,000 package rate reflects priority holds at Resplendent Ceylon properties, peak season demand, exclusive helicopter allocation, and premium concierge service.</em>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
