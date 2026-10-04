import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Image as ImageIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { Activity } from "@/services/master-data.service";
import { saveActivityAction, uploadActivityImageAction } from "@/actions/admin.actions";

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    activity: Activity | null;
}

const padImages = (imagesArray?: string[]) => {
    const arr = imagesArray || [];
    return [
        arr[0] || "/images/activities/",
        arr[1] || "/images/activities/",
        arr[2] || "/images/activities/",
    ];
};

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
        images: ["/images/activities/", "/images/activities/", "/images/activities/"]
    });

    const [isSaving, setIsSaving] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activity) {
            setFormData({
                ...activity,
                images: padImages(activity.images)
            });
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
                images: ["/images/activities/", "/images/activities/", "/images/activities/"]
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

    const handleImageChange = (index: number, val: string) => {
        setFormData(prev => {
            const currentImages = [...(prev.images || ["/images/activities/", "/images/activities/", "/images/activities/"])];
            currentImages[index] = val;
            return { ...prev, images: currentImages };
        });
    };

    const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
        setError(null);

        try {
            const formDataPayload = new FormData();
            formDataPayload.append("file", file);

            const res = await uploadActivityImageAction(formDataPayload);
            if (res.success && res.url) {
                handleImageChange(index, res.url);
            } else {
                setError(res.error || "Failed to upload image");
            }
        } catch (err: any) {
            setError(err.message || "Error uploading image");
        } finally {
            setUploadingIndex(null);
            e.target.value = ""; // reset file input
        }
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

        const cleanImages = (payload.images || [])
            .map((img: string) => img.trim())
            .filter((img: string) => img !== "" && img !== "/images/activities/");
        payload.images = cleanImages;

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

                        <div className="space-y-4 border-t border-neutral-100 pt-6">
                            <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon size={18} className="text-brand-gold" />
                                Activity Images (Up to 3)
                            </h3>
                            <p className="text-xs text-neutral-400">
                                Upload image files (automatically converted and optimized to WebP) or enter relative paths.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[0, 1, 2].map((index) => {
                                    const imgVal = formData.images?.[index] ?? "/images/activities/";
                                    const isValidImg = imgVal && imgVal.trim() !== "" && imgVal !== "/images/activities/";
                                    const isUploading = uploadingIndex === index;

                                    return (
                                        <div key={index} className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80 flex flex-col justify-between">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Image {index + 1}</label>
                                                {isValidImg && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImageChange(index, "/images/activities/")}
                                                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                                                        title="Remove Image"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Preview Box */}
                                            <div className="relative w-full h-28 bg-white rounded-lg border border-neutral-200 overflow-hidden flex items-center justify-center group mb-2">
                                                {isValidImg ? (
                                                    <img
                                                        src={imgVal}
                                                        alt={`Activity Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-neutral-300">
                                                        <ImageIcon size={28} />
                                                        <span className="text-[10px] text-neutral-400">No Image</span>
                                                    </div>
                                                )}

                                                {/* Uploading Overlay */}
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                                                        <Loader2 size={24} className="animate-spin" />
                                                        <span className="text-[10px] font-bold">Optimizing...</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upload Button */}
                                            <div>
                                                <label
                                                    htmlFor={`activity-upload-file-${index}`}
                                                    className={`w-full py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                                                        isUploading
                                                            ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                                            : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400"
                                                    }`}
                                                >
                                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                    {isUploading ? "Uploading..." : "Upload File"}
                                                </label>
                                                <input
                                                    type="file"
                                                    id={`activity-upload-file-${index}`}
                                                    accept="image/*"
                                                    disabled={isUploading}
                                                    onChange={(e) => handleFileUpload(index, e)}
                                                    className="hidden"
                                                />
                                            </div>

                                            {/* Path Input */}
                                            <input
                                                type="text"
                                                value={imgVal}
                                                onChange={(e) => handleImageChange(index, e.target.value)}
                                                className="w-full p-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-gold text-xs text-neutral-600 truncate mt-1"
                                                placeholder="/images/activities/image.avif"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
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
