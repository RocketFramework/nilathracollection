"use client";

import MainLayout from "@/components/layout/MainLayout";
import { blogPosts } from "@/data/blog-posts";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import ReactMarkdown from "react-markdown";

import React, { use } from "react";

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const post = blogPosts.find((p) => p.slug === resolvedParams.slug);

    if (!post) {
        notFound();
    }

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
                                prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:font-light
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
                                        <button className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-logo-blue group">
                                            <Facebook size={18} className="group-hover:text-blue-600" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Facebook</span>
                                        </button>
                                        <button className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-logo-blue group">
                                            <Twitter size={18} className="group-hover:text-sky-500" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Twitter</span>
                                        </button>
                                        <button className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-logo-blue group">
                                            <Linkedin size={18} className="group-hover:text-blue-700" />
                                            <span className="text-xs font-bold uppercase tracking-widest">LinkedIn</span>
                                        </button>
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
