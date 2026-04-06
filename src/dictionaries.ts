import "server-only";

const dictionaries = {
    en: () => import("./dictionaries/en.json").then((module) => module.default),
    de: () => import("./dictionaries/de.json").then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
    if (!dictionaries[locale as keyof typeof dictionaries]) {
        return dictionaries.en();
    }
    return dictionaries[locale as keyof typeof dictionaries]();
};
