/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Settings, useSettings } from "@api/Settings";

export type Locale = "en" | "ru";

/** Current UI locale. Falls back to "en" for any unknown value. */
export function getLocale(): Locale {
    try {
        return Settings.locale === "ru" ? "ru" : "en";
    } catch {
        return "en";
    }
}

export function isRU(): boolean {
    return getLocale() === "ru";
}

/**
 * Translate a UI string. Pass English first, Russian second:
 *   t("Settings", "Настройки")
 * Call it during render so language switches apply instantly.
 */
export function t(en: string, ru: string): string {
    return isRU() ? ru : en;
}

/**
 * React hook that subscribes to locale changes and returns t().
 * Use inside components instead of the bare t() when the component
 * otherwise wouldn't rerender on language switch.
 */
export function useT(): (en: string, ru: string) => string {
    useSettings(["locale"]);
    return t;
}

/** Switch UI language. Persists via the Settings store. */
export function setLocale(locale: Locale) {
    Settings.locale = locale;
}
