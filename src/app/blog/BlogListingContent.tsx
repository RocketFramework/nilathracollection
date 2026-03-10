"use client";

import MainLayout from "@/components/layout/MainLayout";
import { blogPosts } from "@/data/blog-posts";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, User, Clock } from "lucide-react";

import { useState, useMemo } from "react";

export default function BlogListingContent() {
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(blogPosts.map(post => post.category)));
        return ["All", ...uniqueCategories];
    }, []);

    const filteredPosts = useMemo(() => {
        if (activeCategory === "All") return blogPosts;
        return blogPosts.filter(post => post.category === activeCategory);
    }, [activeCategory]);

    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-neutral-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-20 space-y-4">
                        <span className="section-subtitle">The Nilathra Journal</span>
                        <h1 className="text-5xl md:text-7xl font-serif text-logo-blue">Insights & Inspirations</h1>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                            Discover the secrets of the island, from hidden heritage sites to the nuances of world-class concierge service.
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-3 mb-16">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeCategory === category
                                    ? "bg-brand-gold text-white shadow-lg scale-105"
                                    : "bg-white text-neutral-400 hover:text-logo-blue hover:bg-neutral-100 border border-neutral-100"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Blog Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredPosts.map((post, idx) => (
                            <motion.article
                                key={post.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100 flex flex-col h-full hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Image Container */}
                                <div className="relative h-64 overflow-hidden">
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-logo-blue shadow-sm">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="flex items-center gap-4 text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-brand-gold" />
                                            {post.date}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-brand-gold" />
                                            {post.readingTime}
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-serif text-logo-blue mb-4 group-hover:text-logo-red transition-colors leading-tight">
                                        <Link href={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h2>

                                    <p className="text-neutral-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-neutral-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-sand flex items-center justify-center border border-neutral-100">
                                                <User size={14} className="text-logo-blue" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{post.author}</span>
                                        </div>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-logo-blue hover:text-logo-red transition-all group-hover:translate-x-1"
                                        >
                                            <ArrowRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-neutral-400 font-serif text-2xl">No articles found in this category.</p>
                        </div>
                    )}
                </div>
            </section>
        </MainLayout>
    );
}

