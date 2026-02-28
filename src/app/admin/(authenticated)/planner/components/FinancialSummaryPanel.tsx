"use client";

import { useMemo } from "react";
import { Financials, TripData } from "../types";

export function FinancialSummaryPanel({ tripData, updateFinancials }: { tripData: TripData, updateFinancials: (f: Financials) => void }) {

    // Auto-calculate totals
    const totalCost = useMemo(() => {
        const c = tripData.financials.costs;
        return c.flights + c.hotels + c.transport + c.activities + c.guide + c.misc + c.commission + c.tax;
    }, [tripData.financials.costs]);

    const profitMargin = useMemo(() => {
        if (tripData.financials.sellingPrice === 0) return 0;
        return ((tripData.financials.sellingPrice - totalCost) / tripData.financials.sellingPrice) * 100;
    }, [totalCost, tripData.financials.sellingPrice]);

    const handleCostChange = (field: keyof Financials['costs'], value: string) => {
        const val = parseFloat(value) || 0;
        updateFinancials({
            ...tripData.financials,
            costs: {
                ...tripData.financials.costs,
                [field]: val
            }
        });
    };

    const getMarginColor = (margin: number) => {
        if (margin >= 20) return "text-green-600 bg-green-50 border-green-200";
        if (margin >= 10) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-serif text-brand-green">Financial Control Panel</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cost Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                    <h4 className="font-semibold text-neutral-800 mb-4 pb-2 border-b">Trip Cost Breakdown</h4>
                    <div className="space-y-3">
                        {Object.entries(tripData.financials.costs).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="capitalize text-neutral-600">{key}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-400">Rs.</span>
                                    <input
                                        type="number"
                                        value={val || ''}
                                        onChange={(e) => handleCostChange(key as keyof Financials['costs'], e.target.value)}
                                        className="w-24 text-right px-2 py-1 border rounded focus:ring-1 focus:ring-brand-gold"
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-3 border-t mt-3 flex justify-between items-center font-bold text-lg">
                            <span>Total Internal Cost:</span>
                            <span>Rs. {totalCost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Profit Margin */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <h4 className="font-semibold text-neutral-800 mb-4 pb-2 border-b">Pricing Strategy</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1">Selling Price (To Client)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg text-neutral-500 font-medium">Rs.</span>
                                    <input
                                        type="number"
                                        value={tripData.financials.sellingPrice || ''}
                                        onChange={(e) => updateFinancials({ ...tripData.financials, sellingPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-xl font-bold px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-gold"
                                        placeholder="Enter final quote..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Indicator */}
                    <div className={`p-6 rounded-2xl border ${getMarginColor(profitMargin)} flex flex-col items-center justify-center h-32`}>
                        <span className="text-sm font-semibold uppercase tracking-wider mb-1">Profit Margin</span>
                        <span className="text-4xl font-bold font-serif">{profitMargin.toFixed(1)}%</span>
                        {profitMargin < 10 && profitMargin > 0 && <span className="text-xs mt-1 font-medium italic">Warning: Low Margin</span>}
                        {profitMargin <= 0 && <span className="text-xs mt-1 font-medium italic">Danger: Loss Expected</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
