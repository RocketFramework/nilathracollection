"use client";

import { createContext, useContext } from "react";

const I18nContext = createContext<any>({});

export function I18nProvider({
    dictionary,
    children,
}: {
    dictionary: any;
    children: React.ReactNode;
}) {
    return (
        <I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>
    );
}

export function useTranslation() {
    return useContext(I18nContext);
}
