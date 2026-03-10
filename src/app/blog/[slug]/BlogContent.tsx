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
                    <div className="grid lg:grid-cols-[1fr_200px] gap-16">
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
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        </motion.div>

                        {/* Sidebar */}
                        <aside className="hidden lg:block space-y-12">
                            <div className="sticky top-32">
                                <div className="flex flex-col items-center text-center p-8 bg-neutral-50 rounded-3xl border border-neutral-100 mb-10">
                                    <div className="w-20 h-20 rounded-full bg-brand-sand flex items-center justify-center border-4 border-white shadow-sm mb-4">
                                        <User size={32} className="text-logo-blue" />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-black mb-1">Written by</p>
                                    <h4 className="text-logo-blue font-serif text-lg">{post.author}</h4>
                                </div>

                                <div className="space-y-6">
                                    <h5 className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black flex items-center gap-2">
                                        <Share2 size={14} className="text-brand-gold" /> Share Article
                                    </h5>
                                    <div className="flex flex-col gap-3">
                                        {shareActions.map((action) => (
                                            <a
                                                key={action.name}
                                                href={action.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-logo-blue group"
                                            >
                                                <action.icon size={18} className={`transition-colors ${action.color}`} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{action.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-12 space-y-6">
                                    <h5 className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black">
                                        Follow Our Collection
                                    </h5>
                                    <div className="flex flex-wrap gap-4">
                                        {followLinks.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-full bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand-gold hover:border-brand-gold transition-all duration-300 hover:scale-110 shadow-sm"
                                                aria-label={link.label}
                                            >
                                                <link.icon size={18} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
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
