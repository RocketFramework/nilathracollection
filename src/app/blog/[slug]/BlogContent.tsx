"use client";

import MainLayout from "@/components/layout/MainLayout";
import { blogPosts } from "@/data/blog-posts";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import ReactMarkdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { BlogPost } from "@/data/blog-posts";

export default function BlogContent({ post }: { post: BlogPost }) {
    const [shareUrl, setShareUrl] = useState("");

    useEffect(() => {
        setShareUrl(window.location.href);
    }, []);


    const shareActions = [
        {
            name: "Facebook",
            icon: Facebook,
            color: "hover:text-blue-600",
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        {
            name: "Twitter",
            icon: Twitter,
            color: "hover:text-sky-500",
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            color: "hover:text-blue-700",
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        }
    ];

    const followLinks = [
        { icon: Facebook, url: "https://www.facebook.com/profile.php?id=61588628732263", label: "Facebook" },
        { icon: Instagram, url: "https://www.instagram.com/nilathra/", label: "Instagram" },
        { icon: Twitter, url: "https://x.com/nilathraC", label: "X (Twitter)" },
        { icon: Linkedin, url: "https://www.linkedin.com/company/nilathra-travels/?viewAsMember=true", label: "LinkedIn" },
        { icon: Youtube, url: "https://www.youtube.com/@nilathratravels", label: "YouTube" }
    ];

    return (
        <MainLayout>
            <article className="bg-white min-h-screen">
                {/* Hero Header */}
                <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <Link
                                    href="/blog"
                                    className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.3em] mb-4"
                                >
                                    <ArrowLeft size={16} /> Back to Journal
                                </Link>
                                <div className="flex flex-wrap items-center gap-6">
                                    <span className="px-4 py-1.5 bg-brand-gold text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em]">
                                        {post.category}
                                    </span>
                                    <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                                        <Calendar size={14} className="text-brand-gold" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                                        <Clock size={14} className="text-brand-gold" />
                                        {post.readingTime}
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-7xl font-serif text-white leading-tight drop-shadow-lg">
                                    {post.title}
                                </h1>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-4xl mx-auto px-6 py-20">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="prose prose-lg prose-neutral max-w-none 
                            prose-headings:font-serif prose-headings:text-logo-blue
                            prose-h2:mt-20 prose-h2:mb-10
                            prose-h3:mt-16 prose-h3:mb-8
                            prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:font-light prose-p:mb-6
                            prose-li:text-neutral-600 prose-li:font-light
                            prose-strong:text-logo-blue prose-strong:font-bold
                            prose-blockquote:border-l-brand-gold prose-blockquote:bg-neutral-50 prose-blockquote:p-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic"
                    >
                        {post.content.includes("[COMPARISON_TABLE]") ? (
                            (() => {
                                const parts = post.content.split("[COMPARISON_TABLE]");
                                return (
                                    <>
                                        <ReactMarkdown>{parts[0]}</ReactMarkdown>
                                        <ComparisonTable />
                                        <ReactMarkdown>{parts[1]}</ReactMarkdown>
                                    </>
                                );
                            })()
                        ) : (
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        )}

                        {/* Bottom Metadata Section */}
                        <div className="mt-16 pt-12 border-t border-neutral-100 not-prose">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
                                {/* Author info */}
                                <div className="flex items-center gap-4 p-6 bg-[#FAF9F6] rounded-2xl border border-neutral-100">
                                    <div className="w-14 h-14 rounded-full bg-brand-sand flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                                        <User size={24} className="text-logo-blue" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-black mb-0.5">Written by</p>
                                        <h4 className="text-logo-blue font-serif text-base">{post.author}</h4>
                                    </div>
                                </div>

                                {/* Share actions */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-black flex items-center gap-2">
                                        <Share2 size={12} className="text-brand-gold" /> Share Article
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {shareActions.map((action) => (
                                            <a
                                                key={action.name}
                                                href={action.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-100 hover:bg-neutral-50 transition-all text-neutral-500 hover:text-logo-blue text-xs font-bold uppercase tracking-wider"
                                            >
                                                <action.icon size={14} className={`transition-colors ${action.color}`} />
                                                <span>{action.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Follow Collection */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-black">
                                        Follow Our Collection
                                    </h5>
                                    <div className="flex flex-wrap gap-3">
                                        {followLinks.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand-gold hover:border-brand-gold transition-all duration-300 hover:scale-105 shadow-sm"
                                                aria-label={link.label}
                                            >
                                                <link.icon size={16} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Related CTA */}
                <section className="bg-neutral-900 py-24 px-6 md:px-12 text-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]" />
                    </div>
                    <div className="max-w-4xl mx-auto relative z-10">
                        <h2 className="text-3xl md:text-5xl font-serif text-white mb-8">Inspired by our collection?</h2>
                        <p className="text-white/60 text-lg mb-12 font-light">
                            Each article in our journal is a glimpse into the bespoke experiences we curate.<br />
                            Let us architect your own Sri Lankan legacy.
                        </p>
                        <Link href="/custom-plan" className="luxury-button inline-flex">
                            Start Your Journey
                        </Link>
                    </div>
                </section>
            </article>
        </MainLayout >
    );
}

function ComparisonTable() {
    return (
        <div className="my-12 overflow-x-auto border border-neutral-100 rounded-xl shadow-sm bg-white">
            <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm min-w-[580px]">
                <thead>
                    <tr className="bg-logo-blue text-white uppercase text-[10px] sm:text-[11px] tracking-wider border-b border-neutral-200">
                        <th className="p-4 sm:p-5 font-bold text-brand-gold">Category</th>
                        <th className="p-4 sm:p-5 font-bold">Maldives</th>
                        <th className="p-4 sm:p-5 font-bold">Sri Lanka</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-600">
                    <tr className="bg-[#FAF9F6] hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Starting Rate</td>
                        <td className="p-4 sm:p-5">$2,000–$10,000 / night (room only)</td>
                        <td className="p-4 sm:p-5 font-semibold text-brand-green bg-emerald-50/20">$650 - $2,500 / person / day (curated, inclusive)</td>
                    </tr>
                    <tr className="bg-white hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Food &amp; Beverage</td>
                        <td className="p-4 sm:p-5">Captive pricing — no off-resort alternatives</td>
                        <td className="p-4 sm:p-5">Diverse options; half-board included in packages</td>
                    </tr>
                    <tr className="bg-[#FAF9F6] hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Inter-destination Travel</td>
                        <td className="p-4 sm:p-5">Seaplane required ($300–$700 per trip)</td>
                        <td className="p-4 sm:p-5 font-semibold text-brand-green bg-emerald-50/20">Private SUV, helicopter charter, or scenic rail</td>
                    </tr>
                    <tr className="bg-white hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Experiential Range</td>
                        <td className="p-4 sm:p-5">Ocean, reef, resort amenities</td>
                        <td className="p-4 sm:p-5">Culture, safari, coast, highlands, history, cuisine</td>
                    </tr>
                    <tr className="bg-[#FAF9F6] hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Privacy Level</td>
                        <td className="p-4 sm:p-5">Shared resort infrastructure</td>
                        <td className="p-4 sm:p-5 font-semibold text-brand-green bg-emerald-50/20">Full private estate &amp; villa buyouts available</td>
                    </tr>
                    <tr className="bg-white hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Security Options</td>
                        <td className="p-4 sm:p-5">Resort security only</td>
                        <td className="p-4 sm:p-5">CPD, armoured vehicles, NDA protocols</td>
                    </tr>
                    <tr className="bg-[#FAF9F6] hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Authentic Culture</td>
                        <td className="p-4 sm:p-5">Minimal — no permanent indigenous culture</td>
                        <td className="p-4 sm:p-5 font-semibold text-brand-green bg-emerald-50/20">One of the world's oldest living civilisations</td>
                    </tr>
                    <tr className="bg-white hover:bg-neutral-50 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-logo-blue text-[10px] sm:text-[11px] uppercase tracking-wider">Trip Sweet Spot</td>
                        <td className="p-4 sm:p-5">4–6 nights (diminishing returns beyond)</td>
                        <td className="p-4 sm:p-5 font-semibold text-brand-green bg-emerald-50/20">7–21 nights (each day richer than the last)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
