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

import { isRU } from "./locale";
import { ruPlugins } from "./localeRu";

/** Translated plugin description, or the English fallback. */
export function tpDescription(pluginName: string, fallback: string): string {
    if (!isRU()) return fallback;
    return ruPlugins[pluginName]?.d ?? fallback;
}

function txOption(pluginName: string, optionId: string) {
    if (!isRU()) return undefined;
    return ruPlugins[pluginName]?.o?.[optionId];
}

/** Translated option displayName, or the fallback. */
export function txName(pluginName: string, optionId: string, fallback: string | undefined): string | undefined {
    return txOption(pluginName, optionId)?.n ?? fallback;
}

/** Translated option description, or the fallback. */
export function txDesc(pluginName: string, optionId: string, fallback: string | undefined): string | undefined {
    return txOption(pluginName, optionId)?.d ?? fallback;
}

/** Translated option placeholder, or the fallback. */
export function txPlaceholder(pluginName: string, optionId: string, fallback: string | undefined): string | undefined {
    return txOption(pluginName, optionId)?.p ?? fallback;
}

/** Translated select-option labels. Unknown values keep their English label. */
export function txSelectOptions<T extends { label: string; value: unknown; }>(pluginName: string, optionId: string, options: T[] | undefined): T[] | undefined {
    if (!isRU() || !options) return options;
    const map = txOption(pluginName, optionId)?.o;
    if (!map) return options;
    return options.map(o => {
        const label = map[String(o.value)];
        return label ? { ...o, label } : o;
    });
}
