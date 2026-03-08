"use client";

import { useState, useEffect, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRY_CODES } from "@/constants/countries";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onPhoneChange: (phone: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, onPhoneChange, value, ...props }, ref) => {
        const [selectedCountry, setSelectedCountry] = useState(
            COUNTRY_CODES.find(c => c.code === "US") || COUNTRY_CODES[0]
        );
        const [phoneNumber, setPhoneNumber] = useState("");
        const [isOpen, setIsOpen] = useState(false);

        useEffect(() => {
            const fetchCountry = async () => {
                try {
                    const response = await fetch("https://ipapi.co/json/");
                    const data = await response.json();
                    if (data.country_code) {
                        const matchedCountry = COUNTRY_CODES.find(c => c.code === data.country_code);
                        if (matchedCountry) {
                            setSelectedCountry(matchedCountry);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch location data for phone dial code", error);
                }
            };
            fetchCountry();
        }, []);

        useEffect(() => {
            // Split incoming value if it has a country code prefix
            if (typeof value === "string" && value) {
                const matchedCountry = COUNTRY_CODES.find(country => value.startsWith(country.dialCode));
                if (matchedCountry) {
                    setSelectedCountry(matchedCountry);
                    setPhoneNumber(value.substring(matchedCountry.dialCode.length).trim());
                } else {
                    setPhoneNumber(value);
                }
            } else if (value === "") {
                setPhoneNumber("");
            }
        }, [value]);

        const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newNumber = e.target.value;
            setPhoneNumber(newNumber);
            onPhoneChange(`${selectedCountry.dialCode} ${newNumber}`);
        };

        const handleCountryChange = (countryCode: string) => {
            const matchedCountry = COUNTRY_CODES.find(c => c.code === countryCode);
            if (matchedCountry) {
                setSelectedCountry(matchedCountry);
                onPhoneChange(`${matchedCountry.dialCode} ${phoneNumber}`);
                setIsOpen(false);
            }
        };

        return (
            <div className={`flex relative items-center ${className || ''}`}>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 h-full py-3 pr-4 pl-0 bg-transparent text-brand-charcoal hover:bg-neutral-50 focus:outline-none transition-colors"
                    >
                        <span>{selectedCountry.flag}</span>
                        <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                        <ChevronDown size={14} className="text-neutral-400" />
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                            <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-xl z-50">
                                {COUNTRY_CODES.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-3 text-sm transition-colors border-b border-neutral-100 last:border-0"
                                        onClick={() => handleCountryChange(country.code)}
                                    >
                                        <span className="text-lg">{country.flag}</span>
                                        <span className="flex-1 text-brand-charcoal truncate">{country.name}</span>
                                        <span className="text-neutral-500 font-medium">{country.dialCode}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <input
                    {...props}
                    ref={ref}
                    type="tel"
                    value={phoneNumber}
                    onChange={handleNumberChange}
                    className="flex-1 bg-transparent py-3 px-3 outline-none focus:bg-transparent text-brand-charcoal"
                />
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";
