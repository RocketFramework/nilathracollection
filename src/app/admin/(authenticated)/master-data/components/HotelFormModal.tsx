import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";
import { Hotel, HotelRoom, RoomRate, HotelService } from "@/services/hotel.service";
import { MasterDataApprovalsService } from "@/services/master-data-approvals.service";

interface HotelFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotel?: Hotel | null;
    onSave: () => void;
    userRole: string;
}

const TABS = ["Basic Info", "Contacts", "Amenities", "Recreations", "Rooms", "Policies", "Payment Details"];

const ROOM_STANDARDS = [
    "Budget - 3 Star",
    "Premium - 4 Star",
    "Premium - Boutique",
    "Luxury - 5 Star",
    "Luxury - Resort",
    "VIP - Ultra-Luxury Villa with butler",
    "VIP - Presidential Suites with butler"
];

export default function HotelFormModal({ isOpen, onClose, hotel, onSave, userRole }: HotelFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [masterRecreations, setMasterRecreations] = useState<Array<{ id: string, name: string }>>([]);
    const [proofImage, setProofImage] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Hotel>>({
        name: "",
        location_address: "",
        closest_city: "",
        location_coordinates: "",
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
        child_free_until_age: 6,
        child_half_price_until_age: 12,
        child_half_price_percentage: 50,
        child_policy_notes: "",
        rooms: [],
        recreations: [],
        payment_details: {}
    });

    useEffect(() => {
        if (isOpen) {
            fetchMasterData();
            if (hotel) {
                setFormData({ ...hotel });
            } else {
                setFormData({
                    name: "", location_address: "", closest_city: "", location_coordinates: "", description: "", hotel_class: "", number_of_rooms: 0,
                    free_cancellation_weeks: undefined, admin_approved: false, vat_registered: false, is_suspended: false,
                    sales_agent_name: "", sales_agent_contact: "", reservation_agent_name: "", reservation_agent_contact: "",
                    gm_name: "", gm_contact: "", disable_support: "none", outdoor_pool: false, wellness: false,
                    business_facility: false, parking: false, internet: false, airport_shuttle: false,
                    child_free_until_age: 6, child_half_price_until_age: 12, child_half_price_percentage: 50, child_policy_notes: "",
                    rooms: [], recreations: [], payment_details: {}
                });
            }
            setActiveTab(TABS[0]);
            setProofImage(null);
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

    const handleChange = (field: keyof Hotel, value: string | number | boolean | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRoomChange = (index: number, field: keyof HotelRoom, value: string | number | boolean | undefined) => {
        const updatedRooms = [...(formData.rooms || [])];
        updatedRooms[index] = { ...updatedRooms[index], [field]: value };
        setFormData(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const handlePaymentChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            payment_details: {
                ...(prev.payment_details || {}),
                [field]: value
            }
        }));
    };

    const addRoom = () => {
        const newRoom: HotelRoom = {
            room_name: "", room_standard: ROOM_STANDARDS[0], max_guests: 1, room_rates: []
        };
        setFormData(prev => ({ ...prev, rooms: [...(prev.rooms || []), newRoom] }));
    };

    const addRoomRate = (roomIndex: number) => {
        const updatedRooms = [...(formData.rooms || [])];
        const currentRates = updatedRooms[roomIndex].room_rates || [];
        updatedRooms[roomIndex].room_rates = [...currentRates, { start_date: "", end_date: "", rate: 0, meal_plan_type: "BB", breakfast_included: true }];
        setFormData(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const removeRoomRate = (roomIndex: number, rateIndex: number) => {
        const updatedRooms = [...(formData.rooms || [])];
        if (updatedRooms[roomIndex].room_rates) {
            updatedRooms[roomIndex].room_rates.splice(rateIndex, 1);
        }
        setFormData(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const handleRateChange = (roomIndex: number, rateIndex: number, field: keyof RoomRate, value: string | number | boolean | undefined) => {
        const updatedRooms = [...(formData.rooms || [])];
        if (updatedRooms[roomIndex].room_rates) {
            const newRates = [...updatedRooms[roomIndex].room_rates];
            newRates[rateIndex] = { ...newRates[rateIndex], [field]: value };
            updatedRooms[roomIndex].room_rates = newRates;
        }
        setFormData(prev => ({ ...prev, rooms: updatedRooms }));
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
        if (!formData.location_coordinates) return alert("Location coordinates are required");
        setLoading(true);
        try {
            if (userRole === 'agent') {
                let proof_image_url = null;
                const hasPayment = formData.payment_details?.bank_name || formData.payment_details?.account_number;
                if (hasPayment && proofImage) {
                    proof_image_url = await MasterDataApprovalsService.uploadPaymentProofImage(proofImage);
                } else if (hasPayment && !proofImage && !hotel?.payment_details?.id) {
                    alert("A verification proof image is required when setting up payment details.");
                    setLoading(false);
                    return;
                }

                await MasterDataApprovalsService.submitApproval({
                    entity_type: 'hotel',
                    entity_id: formData.id || null,
                    action: formData.id ? 'UPDATE' : 'CREATE',
                    proposed_data: formData,
                    contact_details: { name: formData.gm_name, phone: formData.gm_contact },
                    proof_image_url
                });
                alert("Request sent for Admin approval.");
                onClose();
            } else {
                let savedHotel: Hotel;
                if (formData.id) {
                    savedHotel = await HotelService.updateHotel(formData as Hotel);
                } else {
                    savedHotel = await HotelService.createHotel(formData as Hotel);
                }
                onSave();

                // Re-fetch to get all nested IDs and full state
                if (savedHotel.id) {
                    const updated = await HotelService.getHotel(savedHotel.id);
                    setFormData({ ...updated });
                }

                alert("Hotel saved successfully.");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unknown error occurred";
            alert(`Error saving hotel: ${message}`);
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
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location Address</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.location_address || ''} onChange={e => handleChange('location_address', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Closest City</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.closest_city || ''} onChange={e => handleChange('closest_city', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location Coordinates *</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" placeholder="E.g. 6.9271, 79.8612 or Map URL" value={formData.location_coordinates || ''} onChange={e => handleChange('location_coordinates', e.target.value)} />
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
                                        <div className="col-span-2 md:col-span-1 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Room Name</label>
                                            <input type="text" className="w-full text-sm outline-none text-brand-charcoal font-medium" value={room.room_name} onChange={e => handleRoomChange(index, 'room_name', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 md:col-span-1 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Room Standard</label>
                                            <select
                                                className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent"
                                                value={room.room_standard || ""}
                                                onChange={e => handleRoomChange(index, 'room_standard', e.target.value)}
                                            >
                                                <option value="" disabled>Select Standard</option>
                                                {ROOM_STANDARDS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-1 border border-neutral-200 rounded-xl px-3 py-2">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Max Guests</label>
                                            <input type="number" className="w-full text-sm outline-none text-brand-charcoal font-medium" value={room.max_guests || 1} onChange={e => handleRoomChange(index, 'max_guests', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    
                                    {/* Rates Section */}
                                    <div className="mt-4 border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Room Rates</h4>
                                            <button onClick={(e) => { e.preventDefault(); addRoomRate(index); }} className="text-xs font-bold text-brand-green hover:text-brand-charcoal transition-colors flex items-center gap-1 bg-brand-green/10 px-2 py-1 rounded-lg">
                                                <Plus size={12} /> Add Rate
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {room.room_rates?.map((rate, rIndex) => (
                                                <div key={rIndex} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-white p-3 rounded-lg border border-neutral-200 shadow-sm relative group">
                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Start Date</label>
                                                        <input type="date" className="w-full text-xs outline-none text-brand-charcoal font-medium bg-transparent border-b border-neutral-200 pb-1" value={rate.start_date || ''} onChange={e => handleRateChange(index, rIndex, 'start_date', e.target.value)} />
                                                    </div>
                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">End Date</label>
                                                        <input type="date" className="w-full text-xs outline-none text-brand-charcoal font-medium bg-transparent border-b border-neutral-200 pb-1" value={rate.end_date || ''} onChange={e => handleRateChange(index, rIndex, 'end_date', e.target.value)} />
                                                    </div>
                                                    <div className="flex-1 min-w-[80px]">
                                                        <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Meal Plan</label>
                                                        <select className="w-full text-xs outline-none text-brand-charcoal font-medium bg-transparent border-b border-neutral-200 pb-1" value={rate.meal_plan_type || 'BB'} onChange={e => handleRateChange(index, rIndex, 'meal_plan_type', e.target.value)}>
                                                            <option value="BB">BB</option>
                                                            <option value="HB">HB</option>
                                                            <option value="FB">FB</option>
                                                            <option value="AI">AI</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-1 min-w-[80px]">
                                                        <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Rate ($)</label>
                                                        <input type="number" className="w-full text-xs outline-none text-brand-charcoal font-medium bg-transparent border-b border-neutral-200 pb-1" value={rate.rate || ''} onChange={e => handleRateChange(index, rIndex, 'rate', parseFloat(e.target.value))} />
                                                    </div>
                                                    <div className="flex items-center min-w-[100px] pb-1">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="checkbox" className="w-3 h-3 accent-brand-green" checked={rate.breakfast_included || false} onChange={e => handleRateChange(index, rIndex, 'breakfast_included', e.target.checked)} />
                                                            <span className="text-[9px] font-bold text-neutral-600">Incl. Breakfast</span>
                                                        </label>
                                                    </div>
                                                    <button onClick={(e) => { e.preventDefault(); removeRoomRate(index, rIndex); }} className="text-red-400 hover:text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute -right-2 -top-2 bg-white shadow-sm border border-neutral-100">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!room.room_rates || room.room_rates.length === 0) && (
                                                <div className="text-center py-4 text-xs text-neutral-400 italic border-2 border-dashed border-neutral-200 rounded-lg">
                                                    No rates defined for this room yet.
                                                </div>
                                            )}
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
                    {activeTab === "Policies" && (
                        <div className="space-y-8">
                            <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-brand-green text-white flex items-center justify-center text-sm">1</span>
                                    Child Policy Configuration
                                </h3>
                                <p className="text-sm text-neutral-600 mb-6"> Configure how children are priced at this hotel. These values will be used for automated cost calculations. </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all bg-white">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Free Stay Until Age</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="18"
                                                className="w-full outline-none text-brand-charcoal font-bold text-lg"
                                                value={formData.child_free_until_age ?? 6}
                                                onChange={e => handleChange('child_free_until_age', parseInt(e.target.value) || 0)}
                                            />
                                            <span className="text-neutral-400 font-medium">Years</span>
                                        </div>
                                    </div>

                                    <div className="border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all bg-white">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Half Price Until Age</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="18"
                                                className="w-full outline-none text-brand-charcoal font-bold text-lg"
                                                value={formData.child_half_price_until_age ?? 12}
                                                onChange={e => handleChange('child_half_price_until_age', parseInt(e.target.value) || 0)}
                                            />
                                            <span className="text-neutral-400 font-medium">Years</span>
                                        </div>
                                    </div>

                                    <div className="border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all bg-white">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Half Price Percentage</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full outline-none text-brand-charcoal font-bold text-lg"
                                                value={formData.child_half_price_percentage ?? 50}
                                                onChange={e => handleChange('child_half_price_percentage', parseInt(e.target.value) || 0)}
                                            />
                                            <span className="text-neutral-400 font-medium">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 italic text-xs text-amber-700">
                                    <div className="font-bold flex-shrink-0">Note:</div>
                                    <div>
                                        Children above {formData.child_half_price_until_age || 12} years will be charged at the full adult rate automatically.
                                    </div>
                                </div>
                            </div>

                            <div className="border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all bg-white">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Detailed Policy Notes / Terms</label>
                                <textarea
                                    rows={6}
                                    className="w-full outline-none text-brand-charcoal font-medium resize-none"
                                    placeholder="Enter any additional child policy details, extra bed charges, or special terms..."
                                    value={formData.child_policy_notes || ''}
                                    onChange={e => handleChange('child_policy_notes', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "Payment Details" && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg">Bank Information</div>

                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Bank Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.bank_name || ''} onChange={e => handlePaymentChange('bank_name', e.target.value)} />
                            </div>

                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Branch Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.branch_name || ''} onChange={e => handlePaymentChange('branch_name', e.target.value)} />
                            </div>

                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.account_name || ''} onChange={e => handlePaymentChange('account_name', e.target.value)} />
                            </div>

                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Number</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.account_number || ''} onChange={e => handlePaymentChange('account_number', e.target.value)} />
                            </div>

                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">SWIFT Code</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.swift_code || ''} onChange={e => handlePaymentChange('swift_code', e.target.value)} />
                            </div>

                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg mt-4">Verification Proof</div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-4 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all bg-amber-50/30">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Upload Bank Slip/Document {userRole === 'agent' && '*'}</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="w-full text-sm outline-none text-brand-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 cursor-pointer"
                                    onChange={e => setProofImage(e.target.files?.[0] || null)}
                                />
                                <p className="text-[10px] text-neutral-400 mt-2">Required if adding or updating payment details to ensure accuracy.</p>
                            </div>
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
                        {loading ? "Saving..." : <><Check size={18} /> {userRole === 'agent' ? "Submit for Approval" : (hotel ? "Save Changes" : "Create Hotel")}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
