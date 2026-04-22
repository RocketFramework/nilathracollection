"use client";

import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect } from "react";

export default function WildCeylonPage() {
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
                    background: url('https://images.unsplash.com/photo-1544644181-1484b3fdfc62') center/cover;
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
                    {/* Back Link */}
                    <Link href="/plans/luxury" className="inline-flex items-center gap-2 text-logo-blue hover:text-brand-gold transition-colors mb-8 font-medium">
                        <ArrowLeft size={16} /> Back to Luxury Plan
                    </Link>

                    <header className="ej-hero">
                        <div className="hero-content">
                            <div className="eyebrow">Wild Ceylon & Seclusion</div>
                            <h1>10 Nights / 11 Days</h1>
                            <p className="hero-sub">For 2 Guests · Colombo → Cultural Triangle → Yala → South Coast</p>
                            
                            <div className="stat-pills">
                                <span className="pill">Sigiriya Stopover</span>
                                <span className="pill">Hot Air Balloon</span>
                                <span className="pill">Exclusive Wildlife Lodges</span>
                                <span className="pill">Private Leopard Safari (Relais & Châteaux)</span>
                                <span className="pill">Seaplane Transfers</span>
                                <span className="pill">Boutique Beach Villa</span>
                            </div>
                            
                            <div className="mb-8">
                                <div className="text-white text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">Estimated Grand Total (with premium tier buffer)</div>
                                <div className="text-4xl md:text-5xl font-serif font-bold text-brand-gold">$29,700</div>
                            </div>

                            <Link href="/contact?plan=luxury&nights=11&travelers=2&budget=29700" className="ej-btn">Request This Journey</Link>
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
                                <div className="stop-name">Sigiriya / Dambulla</div>
                                <div className="stop-nights">3 Nights</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">3</div>
                                <div className="stop-name">Yala</div>
                                <div className="stop-nights">3 Nights</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">4</div>
                                <div className="stop-name">South Coast</div>
                                <div className="stop-nights">3 Nights</div>
                            </div>
                            <div className="stop">
                                <div className="stop-icon">5</div>
                                <div className="stop-name">Departure</div>
                                <div className="stop-nights"></div>
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
                                    <p className="day-meta"><strong>Hotel:</strong> Shangri-La Colombo · Deluxe Ocean View King · $224/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">On arrival</div>
                                        <div className="act-title">VIP airport meet & greet</div>
                                        <div className="act-desc">Priority immigration, premium SUV waiting. Chilled towels, welcome drink in vehicle.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">Transfer</div>
                                        <div className="act-title">45-min express to Shangri-La</div>
                                        <div className="act-desc">Seamless city arrival.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">CHI Spa Welcome Ritual</div>
                                        <div className="act-desc">Check-in, 60-min couples jet-lag recovery treatment.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB dinner at Capital Bar & Grill</div>
                                        <div className="act-desc">Exclusive dining experience at the hotel.</div>
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
                                    <h3 className="day-title">Colombo → Sigiriya · Rock Country Begins</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Heritance Kandalama · Royal Suite · $500/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Early breakfast + premium snack box in SUV</div>
                                        <div className="act-desc">Scenic 4-hour drive north to the Cultural Triangle.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">11:00</div>
                                        <div className="act-title">Dambulla Royal Cave Temple</div>
                                        <div className="act-desc">5 caves, 157 Buddha statues, expert private guide. <br/><span className="ticket-pill">Entry: $10 × 2 = $20 incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">13:30</div>
                                        <div className="act-title">Curated fine lunch en route</div>
                                        <div className="act-desc">Premium local flavors. <br/><span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">15:30</div>
                                        <div className="act-title">Check-in Heritance Kandalama</div>
                                        <div className="act-desc">Geoffrey Bawa architectural masterpiece blending into the jungle cliffside.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">17:00</div>
                                        <div className="act-title">Ayurvedic couples spa</div>
                                        <div className="act-desc">Relaxation amidst the sounds of the jungle wetland.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB dinner at Apsara Restaurant</div>
                                        <div className="act-desc">Lakeside candlelit dining.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 03 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">03</div>
                                <div className="day-date">Adventure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Sigiriya · Rock Fortress + Elephant Gathering</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Heritance Kandalama · Royal Suite · $500/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">05:30</div>
                                        <div className="act-title">Sunrise climb — Sigiriya Lion Rock (UNESCO)</div>
                                        <div className="act-desc">Expert guide, lion paws, ancient frescoes, royal palace summit. <br/><span className="ticket-pill">Entry: $36 × 2 = $72 incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">Return breakfast at Heritance Kandalama (HB)</div>
                                        <div className="act-desc">Refresh after the morning ascent.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Villa pool & leisure afternoon</div>
                                        <div className="act-desc">Rest ahead of tomorrow's pre-dawn balloon departure. <br/><span className="ticket-pill">$25/person fine lunch incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Minneriya National Park private jeep safari</div>
                                        <div className="act-desc">Witness 'The Elephant Gathering' — hundreds of wild elephants around an ancient reservoir. <br/><span className="ticket-pill">Safari: $70 all-in incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">HB starlit terrace dinner</div>
                                        <div className="act-desc">Private outdoor setting at the lodge.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 04 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">04</div>
                                <div className="day-date">Adventure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Sigiriya · Hot Air Balloon at Sunrise</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Heritance Kandalama · Royal Suite · $500/night</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">04:45</div>
                                        <div className="act-title">Pre-dawn pickup from villa</div>
                                        <div className="act-desc">Private transfer to balloon launch site, Kandalama.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">05:30</div>
                                        <div className="act-title">🎈 Hot Air Balloon — Sunrise Flight</div>
                                        <div className="act-desc">Float silently above Sigiriya Rock Fortress, ancient reservoirs, and emerald jungle as the sun breaks the horizon. ~1 hour flight. USD $260/person · Sunrise Ballooning / Lanka Ballooning Pvt Ltd · CAA-SL licensed · srilankaballooning.com · Season: Nov–Apr · Champagne celebration on landing. <br/><span className="ticket-pill">Total for 2: $520 incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">08:00</div>
                                        <div className="act-title">Return to villa, full breakfast (HB)</div>
                                        <div className="act-desc">Well-earned morning feast.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">10:00</div>
                                        <div className="act-title">Leisure morning + spa</div>
                                        <div className="act-desc">Final hours in the Cultural Triangle. 60-min hot stone massage.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine lunch + check-out</div>
                                        <div className="act-desc"><br/><span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">15:00</div>
                                        <div className="act-title">Polonnaruwa ancient city en route</div>
                                        <div className="act-desc">Optional UNESCO heritage excursion. Expert guide. <br/><span className="ticket-pill">Entry: $25 × 2 = $50 incl.</span></div>
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
                                    <h3 className="day-title">Cultural Triangle → Yala · Seaplane Transfer</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Wild Coast Tented Lodge · Luxe Tent · Yala (Relais & Châteaux) · rates on request</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Breakfast + transfer to Sigiriya airstrip</div>
                                        <div className="act-desc">Premium snack box in vehicle.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">08:30</div>
                                        <div className="act-title">✈️ Seaplane Transfer — Sigiriya → Hambantota</div>
                                        <div className="act-desc">Cinnamon Air scenic flight over the Cultural Triangle, tank country, and southern coast. Approx. 45–60 minutes. From USD $199/person (Sigiriya to South Coast season offer · cinnamonair.com). Regular fare: ~$230/person. <br/><span className="ticket-pill">Total for 2: ~$398.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">10:00</div>
                                        <div className="act-title">Arrival Hambantota · transfer into Yala</div>
                                        <div className="act-desc">Private vehicle into the national park buffer zone.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">11:30</div>
                                        <div className="act-title">Check-in Wild Coast Tented Lodge</div>
                                        <div className="act-desc">Relais & Châteaux luxury tented camp on the Yala boundary. Butler and naturalist assigned.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">Lodge orientation + first afternoon game drive</div>
                                        <div className="act-desc">Exclusive concession access — away from public park crowds. Private jeep, expert tracker.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Bush sundowners + HB dinner under stars</div>
                                        <div className="act-desc">Fire-lit outdoor dining at camp.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 06 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">06</div>
                                <div className="day-date">Safari</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Yala · Full Private Leopard Safari Day</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Wild Coast Tented Lodge · Luxe Tent · Yala (Relais & Châteaux)</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">05:30</div>
                                        <div className="act-title">🦁 Dawn game drive — private concession</div>
                                        <div className="act-desc">The world's highest density of wild leopards. Dedicated naturalist on foot, expert tracker driving — intimate and exclusive.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">Return to lodge, full breakfast (HB)</div>
                                        <div className="act-desc">Pool and leisure midday.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine lodge lunch + afternoon rest</div>
                                        <div className="act-desc"><span className="ticket-pill">$25/person incl. (lodge kitchen).</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">16:00</div>
                                        <div className="act-title">Dusk game drive — golden hour into Yala</div>
                                        <div className="act-desc">Leopards, elephants, sloth bears, crocodiles, painted storks.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Bush dinner under the Milky Way</div>
                                        <div className="act-desc">Private candlelit setup in the wild. Star-gazing with naturalist.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 07 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">07</div>
                                <div className="day-date">Wellness</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Yala · Wildlife & Wilderness Wellness</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Wild Coast Tented Lodge · Luxe Tent · Yala (Relais & Châteaux)</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">05:30</div>
                                        <div className="act-title">Optional sunrise game drive</div>
                                        <div className="act-desc">Third private safari session — every drive into Yala tells a different story.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">09:00</div>
                                        <div className="act-title">Breakfast (HB)</div>
                                        <div className="act-desc">Leisurely morning at camp.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">11:00</div>
                                        <div className="act-title">Spa at the lodge</div>
                                        <div className="act-desc">Couples wilderness massage — open-air, jungle-side.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine lunch</div>
                                        <div className="act-desc"><span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">Birdwatching walk with naturalist</div>
                                        <div className="act-desc">Yala hosts 200+ bird species including the rare black-necked stork.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Farewell campfire dinner at Wild Coast</div>
                                        <div className="act-desc">HB — final night in the wild.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 08 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">08</div>
                                <div className="day-date">Transfer</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Yala → South Coast · Boutique Beach Villa Check-in</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Boutique Beach Villa · South Coast (Tangalle / Rekawa zone) · rates incl. in package</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">08:00</div>
                                        <div className="act-title">Breakfast + check-out from Yala</div>
                                        <div className="act-desc"></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">09:30</div>
                                        <div className="act-title">Coastal scenic drive west</div>
                                        <div className="act-desc">~2 hours through Hambantota, past flamingo lagoons and salt flats.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">11:30</div>
                                        <div className="act-title">Check-in — Private Boutique Beach Villa</div>
                                        <div className="act-desc">Your own secluded villa on Sri Lanka's quietest coastline. Natural stone, local timber, infinity pool, direct beach access. No neighbors. No agenda.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">Settle in, first swim, villa lunch</div>
                                        <div className="act-desc"><span className="ticket-pill">$25/person fine lunch prepared by in-villa chef.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Sunset cocktails on the beach terrace</div>
                                        <div className="act-desc">HB dinner under the stars.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 09 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">09</div>
                                <div className="day-date">Leisure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">South Coast · Day of Seclusion</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Boutique Beach Villa · South Coast</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Morning</div>
                                        <div className="act-title">Leisurely breakfast at the villa (HB)</div>
                                        <div className="act-desc">Wake up to the sound of the Indian Ocean.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">Optional</div>
                                        <div className="act-title">🐋 Whale watching boat excursion</div>
                                        <div className="act-desc">Blue and sperm whales frequent these waters (seasonal, Nov–Apr). On request — not incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">Optional</div>
                                        <div className="act-title">🐢 Turtle nesting beach walk at dusk</div>
                                        <div className="act-desc">Rekawa Beach — one of Sri Lanka's most important nesting sites. On request — not incl.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">Villa pool + in-villa spa massage</div>
                                        <div className="act-desc">Couples treatment by in-villa therapist.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Private beach dinner setup</div>
                                        <div className="act-desc">Candlelit table on the sand, personalized menu. HB incl.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 10 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">10</div>
                                <div className="day-date">Leisure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">South Coast · Final Full Day</h3>
                                    <p className="day-meta"><strong>Hotel:</strong> Boutique Beach Villa · South Coast</p>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">Morning</div>
                                        <div className="act-title">HB breakfast, final ocean swim</div>
                                        <div className="act-desc"></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">Optional</div>
                                        <div className="act-title">Snorkelling at Polhena Reef, Matara</div>
                                        <div className="act-desc">Vibrant coral, sea turtles — 30 min drive. On request.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">Optional</div>
                                        <div className="act-title">Cooking class with local family</div>
                                        <div className="act-desc">Learn authentic Sri Lankan rice & curry. On request.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">Afternoon</div>
                                        <div className="act-title">Spa + pool + hammock</div>
                                        <div className="act-desc">Full rest.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">13:00</div>
                                        <div className="act-title">Fine farewell lunch</div>
                                        <div className="act-desc"><span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">Evening</div>
                                        <div className="act-title">Farewell tasting dinner</div>
                                        <div className="act-desc">In-villa chef prepares a curated farewell menu. HB incl.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAY 11 */}
                        <div className="day-card reveal">
                            <div className="day-left">
                                <div className="day-num">11</div>
                                <div className="day-date">Departure</div>
                            </div>
                            <div className="day-right">
                                <div className="day-header">
                                    <h3 className="day-title">Departure · South Coast → Colombo</h3>
                                </div>
                                <div className="timeline">
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">07:00</div>
                                        <div className="act-title">Final breakfast (HB)</div>
                                        <div className="act-desc">Last view of the Indian Ocean.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-blue"></div>
                                        <div className="time">08:00</div>
                                        <div className="act-title">Optional boutique shopping</div>
                                        <div className="act-desc">Local artisans, batik, Ceylon tea, moonstone jewelry.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-teal"></div>
                                        <div className="time">09:30</div>
                                        <div className="act-title">✈️ Optional Seaplane Return — Koggala → Colombo</div>
                                        <div className="act-desc">Cinnamon Air from Galle/South Coast to Colombo. Approx. 40 minutes. From USD $155/person (current promotional fare; regular $206/person · cinnamonair.com). Included in premium package — confirm at booking. <br/><span className="ticket-pill">Total for 2: ~$310.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-coral"></div>
                                        <div className="time">— OR —</div>
                                        <div className="act-title">Express coastal highway transfer</div>
                                        <div className="act-desc">Premium Land Cruiser, ~2.5 hours to Colombo BIA.</div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-amber"></div>
                                        <div className="time">En route</div>
                                        <div className="act-title">Farewell fine dining lunch stop</div>
                                        <div className="act-desc">Last taste of Sri Lanka. <br/><span className="ticket-pill">$25/person incl.</span></div>
                                    </div>
                                    <div className="timeline-item reveal-item">
                                        <div className="timeline-dot dot-purple"></div>
                                        <div className="time">15:30+</div>
                                        <div className="act-title">VIP airport departure</div>
                                        <div className="act-desc">Check-in facilitation, lounge access, farewell gift.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </section>

                    <section className="ej-section reveal">
                        <h2 className="section-title">Signature Lodge Portfolio</h2>
                        <div className="hotel-grid">
                            <div className="hotel-card reveal">
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/shangri-la-hotel-colombo.jpg')" }}></div>
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
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/heritance-kandalama.jpg')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Heritance Kandalama</h3>
                                    <div className="hotel-loc">Sigiriya</div>
                                    <div className="hotel-room">Royal Suite</div>
                                    <div className="hotel-rate">$500 / night</div>
                                    <ul className="hotel-bullets">
                                        <li>Iconic Geoffrey Bawa architecture</li>
                                        <li>Panoramic views of Kandalama Lake and Sigiriya Rock</li>
                                        <li>Six Senses Spa</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hotel-card reveal">
                                <div className="hotel-img" style={{ backgroundImage: "url('/images/wild-coast-tented-lodge.jpg')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Wild Coast Tented Lodge</h3>
                                    <div className="hotel-loc">Yala (Relais & Châteaux)</div>
                                    <div className="hotel-room">Luxe Tent</div>
                                    <div className="hotel-rate">Rates on request</div>
                                    <ul className="hotel-bullets">
                                        <li>Exclusive private concession — away from public Yala crowds</li>
                                        <li>World's highest density of wild leopards</li>
                                        <li>Only Relais & Châteaux property in Yala</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="hotel-card reveal">
                                <div className="hotel-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80')" }}></div>
                                <div className="hotel-body">
                                    <div className="hotel-stars">★★★★★</div>
                                    <h3 className="hotel-name">Boutique Beach Villa</h3>
                                    <div className="hotel-loc">South Coast (Tangalle / Rekawa zone)</div>
                                    <div className="hotel-room">Private Villa</div>
                                    <div className="hotel-rate">Rates on request</div>
                                    <ul className="hotel-bullets">
                                        <li>Entirely private — exclusive use for 2 guests</li>
                                        <li>Direct beach access, infinity pool, in-villa chef</li>
                                        <li>Sri Lanka's most secluded southern coastline</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="ej-section reveal">
                        <h2 className="section-title">Your Private Transport</h2>
                        <div className="bg-white p-10 rounded-lg shadow-[0_4px_20px_rgba(12,35,64,0.03)] mb-12">
                            <h3 className="text-2xl font-serif text-logo-blue mb-4">Toyota Land Cruiser 200 Series</h3>
                            <ul className="list-none space-y-3 mb-8">
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Premium leather interior, dual-zone climate control, generous luggage space</li>
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Complimentary chilled water, refreshing towels, and snack boxes daily</li>
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Onboard Wi-Fi enabled (subject to network coverage)</li>
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> 24/7 dedicated English-speaking chauffeur-guide</li>
                            </ul>
                            
                            <h3 className="text-2xl font-serif text-logo-blue mb-4 mt-12 border-t pt-8">Plus: Cinnamon Air Seaplane Transfers</h3>
                            <ul className="list-none space-y-3">
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Cessna 208 amphibian aircraft</li>
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Up to 8 passengers</li>
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Panoramic aerial views island-wide</li>
                                <li className="flex items-start gap-3"><Check size={18} className="text-brand-gold mt-1 shrink-0" /> Sectors included: Sigiriya → Hambantota (Day 5) + Koggala → Colombo (Day 11, premium option)</li>
                            </ul>
                        </div>
                    </section>

                    <section className="ej-section reveal">
                        <h2 className="section-title">What's Included</h2>
                        <div className="inclusions-grid">
                            <div className="inc-item">
                                <div className="inc-icon">🍽️</div>
                                <div className="inc-text">Half-board dining (breakfast + dinner) at all properties</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🥂</div>
                                <div className="inc-text">Daily curated fine lunch ($25/person)</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🚙</div>
                                <div className="inc-text">Premium Land Cruiser + chauffeur 11 days</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">✈️</div>
                                <div className="inc-text">2 × Cinnamon Air seaplane transfers</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🎈</div>
                                <div className="inc-text">Hot air balloon — Sunrise Ballooning ($260/person)</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🦁</div>
                                <div className="inc-text">3 private game drives — exclusive Yala concession</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">💆</div>
                                <div className="inc-text">Daily couples spa / wellness treatment</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🎟️</div>
                                <div className="inc-text">All site entrance tickets</div>
                            </div>
                            <div className="inc-item">
                                <div className="inc-icon">🧭</div>
                                <div className="inc-text">Private expert naturalist guide throughout</div>
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
                        <div className="pricing-table-container">
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
                                        <td>Signature Resorts, Lodges & Villa (HB)</td>
                                        <td>10% service fee incl. · Shangri-La $224 (1N) + Heritance Kandalama $500 (3N) + Wild Coast Tented Lodge $1,000 (3N) + Beach Villa est. $400 (3N) + HB supplement ~$900</td>
                                        <td>$7,458</td>
                                    </tr>
                                    <tr>
                                        <td>Premium Land Cruiser, Fuel & Driver</td>
                                        <td>$180 × 11 days</td>
                                        <td>$1,980</td>
                                    </tr>
                                    <tr>
                                        <td>Curated Fine Dining Lunches</td>
                                        <td>$25 × 2 persons × 10 days</td>
                                        <td>$500</td>
                                    </tr>
                                    <tr>
                                        <td>Seaplane Transfers — Cinnamon Air</td>
                                        <td>$199 × 2 (Sigiriya→Hambantota) + $155 × 2 (Koggala→Colombo)</td>
                                        <td>$708</td>
                                    </tr>
                                    <tr>
                                        <td>Hot Air Balloon — Sunrise Ballooning</td>
                                        <td>$260 × 2 persons</td>
                                        <td>$520</td>
                                    </tr>
                                    <tr>
                                        <td>Private Game Drives — Yala Exclusive Concession</td>
                                        <td>$150 × 3 drives × 2 persons</td>
                                        <td>$900</td>
                                    </tr>
                                    <tr>
                                        <td>Daily Wellness & Spa</td>
                                        <td>$100 × 2 persons × 10 nights</td>
                                        <td>$2,000</td>
                                    </tr>
                                    <tr>
                                        <td>Elite Naturalist Guide & Site Access</td>
                                        <td>$100 × 11 days</td>
                                        <td>$1,100</td>
                                    </tr>
                                    <tr>
                                        <td>Invisible Concierge & Precision Logistics</td>
                                        <td>Seamless transfers, 24/7 support, pre-arranged reservations</td>
                                        <td>$2,000</td>
                                    </tr>
                                    <tr className="total-row bg-logo-blue/5">
                                        <td className="!text-logo-blue">Total Base Cost</td>
                                        <td className="!text-logo-blue">Sum of all journey components</td>
                                        <td className="!text-brand-gold">$17,166</td>
                                    </tr>
                                    <tr>
                                        <td>Agency Planning & Service Fee</td>
                                        <td>25% of Total Base Cost</td>
                                        <td>$4,292</td>
                                    </tr>
                                    <tr className="total-row bg-logo-blue/5">
                                        <td className="!text-logo-blue">Gross Total</td>
                                        <td className="!text-logo-blue">Total Base Cost + Agency Fee</td>
                                        <td className="!text-brand-gold">$21,458</td>
                                    </tr>
                                    <tr>
                                        <td>Government Tax</td>
                                        <td>18% VAT applied to Gross Total</td>
                                        <td>$3,862</td>
                                    </tr>
                                    <tr className="total-row">
                                        <td>Standard Package Total</td>
                                        <td>2 Persons · 10 Nights · 11 Days</td>
                                        <td>$25,320</td>
                                    </tr>
                                    <tr className="total-row !bg-brand-gold">
                                        <td className="!text-white">Estimated Grand Total (with premium tier buffer)</td>
                                        <td className="!text-white">Peak-season variance cover + priority allocation at exclusive properties + concierge buffer</td>
                                        <td className="!text-navy !font-black">$29,700</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="price-note mt-8">
                                <strong>Pricing Transparency Note:</strong> The cost values below are actual costs sourced directly from each service provider as of April 21st, 2026. These values may vary depending on your specific choices, preferences, and travel dates. We are committed to complete transparency and will always show you the actual costs.
                            </p>
                            <p className="price-note text-xs mt-2 opacity-75">
                                *Rates are indicative for the 2025/2026 season. Peak season (Dec–Mar) may vary. Wild Coast Tented Lodge and Beach Villa rates are estimated — confirmed rates provided upon enquiry. Seaplane rates sourced from cinnamonair.com (April 2026). Hot air balloon rate sourced from Sunrise Ballooning / Lanka Ballooning Pvt Ltd (srilankaballooning.com). All site entrance fees are included within the Elite Guides & Logistics budget.*
                            </p>
                        </div>
                    </section>
                    
                    <div className="text-center mt-20 mb-10 reveal">
                        <Link href="/contact?plan=luxury&nights=11&travelers=2&budget=29700" className="ej-btn text-lg py-5 px-10">Request This Journey</Link>
                    </div>
                </div>
            </div>

            <button 
                id="backToTop" 
                className="fixed bottom-8 right-8 w-12 h-12 bg-logo-blue text-white rounded-full flex items-center justify-center shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none hover:bg-brand-gold"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                ↑
            </button>
            <style dangerouslySetInnerHTML={{ __html: `
                #backToTop.visible { opacity: 1; pointer-events: auto; }
            `}} />
        </MainLayout>
    );
}
