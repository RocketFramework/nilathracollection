import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { Activity } from "@/services/master-data.service";
import { saveActivityAction } from "@/actions/admin.actions";

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    activity: Activity | null;
}

export default function ActivityFormModal({ isOpen, onClose, onSave, activity }: ActivityFormModalProps) {
    const [formData, setFormData] = useState<Partial<Activity>>({
        activity_name: "",
        category: "",
        location_name: "",
        district: "",
        description: "",
        duration_hours: 1,
        time_flexible: true,
        optimal_start_time: "",
        optimal_end_time: "",
        lat: 0,
        lng: 0,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activity) {
            setFormData(activity);
        } else {
            setFormData({
                activity_name: "",
                category: "",
                location_name: "",
                district: "",
                description: "",
                duration_hours: 1,
                time_flexible: true,
                optimal_start_time: "",
                optimal_end_time: "",
                lat: 0,
                lng: 0,
            });
        }
        setError(null);
    }, [activity, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;

        if (type === 'number') {
            finalValue = value === "" ? "" : Number(value);
        } else if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const payload: any = { ...formData };
        delete payload.price; // Ensure no stale price goes to the DB
        if (payload.optimal_start_time === "") payload.optimal_start_time = null;
        if (payload.optimal_end_time === "") payload.optimal_end_time = null;
        if (payload.lat === "") payload.lat = null;
        if (payload.lng === "") payload.lng = null;
        if (payload.duration_hours === "") payload.duration_hours = null;

        try {
            const res = await saveActivityAction(payload);
            if (res.success) {
                onSave();
                onClose();
            } else {
                setError(res.error || "Failed to save activity");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-neutral-100 shrink-0">
                    <h2 className="text-xl font-bold font-playfair text-brand-charcoal">
                        {activity ? "Edit Activity" : "Add New Activity"}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form id="activity-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Activity Name *</label>
                                <input
                                    type="text"
                                    name="activity_name"
                                    required
                                    value={formData.activity_name || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                    placeholder="e.g. Hot Air Ballooning"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Category *</label>
                                <input
                                    type="text"
                                    name="category"
                                    required
                                    value={formData.category || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                    placeholder="e.g. Adventure, Wildlife"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location Name *</label>
                                <input
                                    type="text"
                                    name="location_name"
                                    required
                                    value={formData.location_name || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                    placeholder="e.g. Dambulla"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">District *</label>
                                <input
                                    type="text"
                                    name="district"
                                    required
                                    value={formData.district || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                    placeholder="e.g. Matale"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Duration (Hours) *</label>
                                <input
                                    type="number"
                                    name="duration_hours"
                                    required
                                    step="0.5"
                                    min="0"
                                    value={formData.duration_hours || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                />
                            </div>


                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Optimal Start Time</label>
                                <input
                                    type="time"
                                    name="optimal_start_time"
                                    value={formData.optimal_start_time || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Optimal End Time</label>
                                <input
                                    type="time"
                                    name="optimal_end_time"
                                    value={formData.optimal_end_time || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                required
                                value={formData.description || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm resize-none"
                            ></textarea>
                        </div>

                        <div className="flex items-center gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                            <input
                                type="checkbox"
                                id="time_flexible"
                                name="time_flexible"
                                checked={formData.time_flexible || false}
                                onChange={handleChange}
                                className="w-5 h-5 text-brand-gold border-neutral-300 rounded focus:ring-brand-gold"
                            />
                            <label htmlFor="time_flexible" className="text-sm font-medium text-brand-charcoal cursor-pointer">
                                Time Flexible? (Can this activity be done at any time of the day?)
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="lat"
                                    value={formData.lat || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="lng"
                                    value={formData.lng || ""}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold text-sm"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="activity-form"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg font-medium bg-brand-charcoal text-white hover:bg-black transition-colors flex items-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle size={18} />
                        )}
                        {isSaving ? "Saving..." : "Save Activity"}
                    </button>
                </div>
            </div>
        </div>
    );
}
