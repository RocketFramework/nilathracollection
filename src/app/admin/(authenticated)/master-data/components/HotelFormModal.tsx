import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";
import { Hotel, HotelRoom, HotelRecreation, HotelService } from "@/services/hotel.service";

interface HotelFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotel?: Hotel | null;
    onSave: () => void;
}

const TABS = ["Basic Info", "Contacts", "Amenities", "Recreations", "Rooms"];

export default function HotelFormModal({ isOpen, onClose, hotel, onSave }: HotelFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [masterRecreations, setMasterRecreations] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState<Partial<Hotel>>({
        name: "",
        location: "",
        description: "",
        hotel_class: "",
        number_of_rooms: 0,
        free_cancellation_weeks: undefined,
        admin_approved: false,
        vat_registered: false,
        is_suspended: false,
        sales_agent_name: "",
        sales_agent_contact: "",
        reservation_agent_name: "",
        reservation_agent_contact: "",
        gm_name: "",
        gm_contact: "",
        disable_support: "none",
        outdoor_pool: false,
        wellness: false,
        business_facility: false,
        parking: false,
        internet: false,
        airport_shuttle: false,
        rooms: [],
        recreations: []
    });

    useEffect(() => {
        if (isOpen) {
            fetchMasterData();
            if (hotel) {
                setFormData({ ...hotel });
            } else {
                setFormData({
                    name: "", location: "", description: "", hotel_class: "", number_of_rooms: 0,
                    free_cancellation_weeks: undefined, admin_approved: false, vat_registered: false, is_suspended: false,
                    sales_agent_name: "", sales_agent_contact: "", reservation_agent_name: "", reservation_agent_contact: "",
                    gm_name: "", gm_contact: "", disable_support: "none", outdoor_pool: false, wellness: false,
                    business_facility: false, parking: false, internet: false, airport_shuttle: false,
                    rooms: [], recreations: []
                });
            }
            setActiveTab(TABS[0]);
        }
    }, [isOpen, hotel]);

    const fetchMasterData = async () => {
        try {
            const recs = await HotelService.getMasterRecreations();
            setMasterRecreations(recs || []);
        } catch (err) {
            console.error("Failed to load master recreations", err);
        }
    };

    const handleChange = (field: keyof Hotel, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRoomChange = (index: number, field: keyof HotelRoom, value: any) => {
        const updatedRooms = [...(formData.rooms || [])];
        updatedRooms[index] = { ...updatedRooms[index], [field]: value };
        setFormData(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const addRoom = () => {
        const newRoom: HotelRoom = {
            room_name: "", max_guests: 1, breakfast_included: false,
            summer_bb_rate: 0, summer_hb_rate: 0, summer_fb_rate: 0,
            winter_bb_rate: 0, winter_hb_rate: 0, winter_fb_rate: 0,
            rate_years_applicable: 1
        };
        setFormData(prev => ({ ...prev, rooms: [...(prev.rooms || []), newRoom] }));
    };

    const removeRoom = (index: number) => {
        const updatedRooms = [...(formData.rooms || [])];
        updatedRooms.splice(index, 1);
        setFormData(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const toggleRecreation = (recreationId: string) => {
        const currentRecreations = [...(formData.recreations || [])];
        const index = currentRecreations.findIndex(r => r.recreation_id === recreationId);

        if (index >= 0) {
            currentRecreations.splice(index, 1);
        } else {
            currentRecreations.push({ recreation_id: recreationId, additional_charge: false });
        }
        setFormData(prev => ({ ...prev, recreations: currentRecreations }));
    };

    const setRecreationCharge = (recreationId: string, charge: boolean) => {
        const currentRecreations = [...(formData.recreations || [])];
        const index = currentRecreations.findIndex(r => r.recreation_id === recreationId);
        if (index >= 0) {
            currentRecreations[index].additional_charge = charge;
            setFormData(prev => ({ ...prev, recreations: currentRecreations }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert("Hotel name is required");
        setLoading(true);
        try {
            if (formData.id) {
                await HotelService.updateHotel(formData as Hotel);
            } else {
                await HotelService.createHotel(formData as Hotel);
            }
            onSave();
            onClose();
        } catch (err: any) {
            alert(`Error saving hotel: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center overflow-y-auto pt-10 pb-10">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-100">
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        {hotel ? "Edit Hotel / Resort" : "Add New Hotel / Resort"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-100 px-6 bg-neutral-50/50">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors border-b-2 ${activeTab === tab ? "border-brand-green text-brand-green bg-brand-green/5" : "border-transparent text-neutral-500 hover:text-brand-charcoal"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === "Basic Info" && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hotel Name *</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                                <textarea rows={3} className="w-full outline-none text-brand-charcoal font-medium" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hotel Class (Star Rating)</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.hotel_class || ''} onChange={e => handleChange('hotel_class', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Rooms</label>
                                <input type="number" className="w-full outline-none text-brand-charcoal font-medium" value={formData.number_of_rooms || 0} onChange={e => handleChange('number_of_rooms', parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Free Cancellation Before (Weeks)</label>
                                <input type="number" min="0" className="w-full outline-none text-brand-charcoal font-medium" value={formData.free_cancellation_weeks || ''} onChange={e => handleChange('free_cancellation_weeks', parseInt(e.target.value))} />
                            </div>

                            <div className="col-span-2 flex flex-wrap gap-6 mt-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-brand-green rounded border-neutral-300" checked={formData.admin_approved || false} onChange={e => handleChange('admin_approved', e.target.checked)} />
                                    <span className="text-sm font-bold text-neutral-600 group-hover:text-brand-charcoal transition-colors">Admin Approved</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-brand-green rounded border-neutral-300" checked={formData.vat_registered || false} onChange={e => handleChange('vat_registered', e.target.checked)} />
                                    <span className="text-sm font-bold text-neutral-600 group-hover:text-brand-charcoal transition-colors">VAT Registered</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Suspended</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "Contacts" && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Sales Agent */}
                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg">Sales Agent</div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.sales_agent_name || ''} onChange={e => handleChange('sales_agent_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.sales_agent_contact || ''} onChange={e => handleChange('sales_agent_contact', e.target.value)} />
                            </div>

                            {/* Reservation Agent */}
                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg mt-4">Reservation Agent</div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.reservation_agent_name || ''} onChange={e => handleChange('reservation_agent_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.reservation_agent_contact || ''} onChange={e => handleChange('reservation_agent_contact', e.target.value)} />
                            </div>

                            {/* GM */}
                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg mt-4">General Manager</div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.gm_name || ''} onChange={e => handleChange('gm_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.gm_contact || ''} onChange={e => handleChange('gm_contact', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {activeTab === "Amenities" && (
                        <div className="space-y-6">
                            <div className="border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all max-w-md">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Disabled Support</label>
                                <select
                                    className="w-full outline-none text-brand-charcoal font-medium bg-transparent"
                                    value={formData.disable_support || 'none'}
                                    onChange={e => handleChange('disable_support', e.target.value)}
                                >
                                    <option value="none">None</option>
                                    <option value="some areas">Some Areas</option>
                                    <option value="full access">Full Access</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                {[
                                    { key: 'outdoor_pool', label: 'Outdoor Pool' },
                                    { key: 'wellness', label: 'Wellness / Spa' },
                                    { key: 'business_facility', label: 'Business Facility' },
                                    { key: 'parking', label: 'Parking Available' },
                                    { key: 'internet', label: 'Free Internet/WiFi' },
                                    { key: 'airport_shuttle', label: 'Airport Shuttle' },
                                ].map(amenity => (
                                    <label key={amenity.key} className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border border-neutral-100 hover:border-brand-green/30 hover:bg-brand-green/5 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                            checked={!!formData[amenity.key as keyof Hotel]}
                                            onChange={e => handleChange(amenity.key as keyof Hotel, e.target.checked)}
                                        />
                                        <span className="text-sm font-bold text-neutral-700 group-hover:text-brand-charcoal transition-colors">{amenity.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "Recreations" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {masterRecreations.map(recreation => {
                                const isSelected = formData.recreations?.some(r => r.recreation_id === recreation.id);
                                const currentRecreation = formData.recreations?.find(r => r.recreation_id === recreation.id);

                                return (
                                    <div key={recreation.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between ${isSelected ? 'border-brand-green bg-brand-green/5' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}>
                                        <label className="flex items-center gap-3 cursor-pointer flex-1 group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                                checked={isSelected || false}
                                                onChange={() => toggleRecreation(recreation.id)}
                                            />
                                            <span className="text-sm font-bold text-neutral-700 group-hover:text-brand-charcoal transition-colors">{recreation.name}</span>
                                        </label>

                                        {isSelected && (
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm ml-4">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 accent-amber-500 rounded border-neutral-300"
                                                    checked={currentRecreation?.additional_charge || false}
                                                    onChange={(e) => setRecreationCharge(recreation.id, e.target.checked)}
                                                />
                                                <span className="text-xs font-bold text-neutral-600">Extra Charge</span>
                                            </label>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {activeTab === "Rooms" && (
                        <div className="space-y-6">
                            {formData.rooms?.map((room, index) => (
                                <div key={index} className="border border-neutral-200 rounded-xl p-5 relative bg-white shadow-sm group">
                                    <button
                                        onClick={() => removeRoom(index)}
                                        className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="col-span-2 md:col-span-2 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Room Name</label>
                                            <input type="text" className="w-full text-sm outline-none text-brand-charcoal font-medium" value={room.room_name} onChange={e => handleRoomChange(index, 'room_name', e.target.value)} />
                                        </div>
                                        <div className="col-span-1 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Max Guests</label>
                                            <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium" value={room.max_guests || 1} onChange={e => handleRoomChange(index, 'max_guests', parseInt(e.target.value))} />
                                        </div>
                                        <div className="col-span-1 border border-neutral-200 rounded-xl px-3 py-2 flex items-center h-full">
                                            <label className="flex items-center gap-2 cursor-pointer pt-2">
                                                <input type="checkbox" className="w-4 h-4 accent-brand-green rounded border-neutral-300" checked={room.breakfast_included || false} onChange={e => handleRoomChange(index, 'breakfast_included', e.target.checked)} />
                                                <span className="text-xs font-bold text-neutral-600">Incl. Breakfast</span>
                                            </label>
                                        </div>

                                        {/* Rates Summer */}
                                        <div className="col-span-2 border border-amber-200/50 bg-amber-50/30 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-amber-600 uppercase">Summer Start</label>
                                            <input type="date" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent" value={room.summer_start_date || ''} onChange={e => handleRoomChange(index, 'summer_start_date', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 border border-amber-200/50 bg-amber-50/30 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-amber-600 uppercase">Summer End</label>
                                            <input type="date" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent" value={room.summer_end_date || ''} onChange={e => handleRoomChange(index, 'summer_end_date', e.target.value)} />
                                        </div>
                                        <div className="col-span-4 grid grid-cols-3 gap-2 border border-amber-200/50 bg-amber-50/30 rounded-xl p-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Summer BB (USD)</label>
                                                <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent border-b border-amber-200/50" value={room.summer_bb_rate || ''} onChange={e => handleRoomChange(index, 'summer_bb_rate', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Summer HB (USD)</label>
                                                <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent border-b border-amber-200/50" value={room.summer_hb_rate || ''} onChange={e => handleRoomChange(index, 'summer_hb_rate', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Summer FB (USD)</label>
                                                <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent border-b border-amber-200/50" value={room.summer_fb_rate || ''} onChange={e => handleRoomChange(index, 'summer_fb_rate', parseFloat(e.target.value))} />
                                            </div>
                                        </div>

                                        {/* Rates Winter */}
                                        <div className="col-span-2 border border-blue-200/50 bg-blue-50/30 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-blue-600 uppercase">Winter Start</label>
                                            <input type="date" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent" value={room.winter_start_date || ''} onChange={e => handleRoomChange(index, 'winter_start_date', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 border border-blue-200/50 bg-blue-50/30 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-blue-600 uppercase">Winter End</label>
                                            <input type="date" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent" value={room.winter_end_date || ''} onChange={e => handleRoomChange(index, 'winter_end_date', e.target.value)} />
                                        </div>
                                        <div className="col-span-4 grid grid-cols-3 gap-2 border border-blue-200/50 bg-blue-50/30 rounded-xl p-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Winter BB (USD)</label>
                                                <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent border-b border-blue-200/50" value={room.winter_bb_rate || ''} onChange={e => handleRoomChange(index, 'winter_bb_rate', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Winter HB (USD)</label>
                                                <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent border-b border-blue-200/50" value={room.winter_hb_rate || ''} onChange={e => handleRoomChange(index, 'winter_hb_rate', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Winter FB (USD)</label>
                                                <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent border-b border-blue-200/50" value={room.winter_fb_rate || ''} onChange={e => handleRoomChange(index, 'winter_fb_rate', parseFloat(e.target.value))} />
                                            </div>
                                        </div>

                                        {/* Rate details */}
                                        <div className="col-span-2 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Rate Received Date</label>
                                            <input type="date" className="w-full text-sm outline-none text-brand-charcoal font-medium" value={room.rate_received_date || ''} onChange={e => handleRoomChange(index, 'rate_received_date', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Rate Applicable Years</label>
                                            <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium" value={room.rate_years_applicable || 1} onChange={e => handleRoomChange(index, 'rate_years_applicable', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addRoom}
                                className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 font-bold hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Add Room Strategy
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-4 rounded-b-2xl shadow-inner">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-sm ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-charcoal hover:shadow-md'}`}
                    >
                        {loading ? "Saving..." : <><Check size={18} /> {hotel ? "Save Changes" : "Create Hotel"}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
