import i18n_data from "./labels.json";

// Types
import type { ZombiI18NData } from "./types";

const lang_data: ZombiI18NData = i18n_data;

/**
 * Returns and object with all the data defined on labels.json in the laguage referenced on the argument
 * @param lang The language to get the data from
 * @returns An object with all the labels for a given language
 */
export const get_lang_data = (lang: string): Record<string, string> => lang_data[lang];

/**
 * Returns true if the language exists on lang data (labels.json)
 * @param lang The language to check if exists
 * @returns True id there is data for that language
 */
export const language_exists = (lang: string): boolean => i18n_data && typeof lang_data[lang] !== "undefined";

/**
 * Returns a label translated to the language passed a argument
 * @param language The language to get the label from or
 * @param label The label to translate
 * @returns The label translated
 */
export const label =  (language: string, label: string): string =>  (language && lang_data[language] && lang_data[language][label]) ? lang_data[language][label] : `[${label}]`;

    

