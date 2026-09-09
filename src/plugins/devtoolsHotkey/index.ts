/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

function openDevTools() {
    // 1. Primary: VencordNative IPC (reliable, works via main process)
    try {
        const vn = (window as any).VencordNative;
        if (vn?.native?.toggleDevTools) {
            vn.native.toggleDevTools();
            return true;
        }
    } catch { }

    // 2. Direct Electron ipcRenderer (fallback if VencordNative not yet loaded)
    try {
        const electron = (window as any).require?.("electron");
        if (electron?.ipcRenderer) {
            electron.ipcRenderer.invoke("VencordToggleDevTools");
            return true;
        }
    } catch { }

    // 3. Discord Desktop - DiscordNative.window
    try {
        const w = (window as any).DiscordNative?.window;
        if (w?.openDevTools) {
            w.openDevTools();
            return true;
        }
        if (w?.toggleDevTools) {
            w.toggleDevTools();
            return true;
        }
    } catch { }

    // 4. Vesktop
    try {
        const vesktop = (window as any).VesktopNative?.window ?? (window as any).Vesktop?.window ?? (window as any).vesktop?.window;
        if (vesktop?.openDevTools) {
            vesktop.openDevTools();
            return true;
        }
        if (vesktop?.toggleDevTools) {
            vesktop.toggleDevTools();
            return true;
        }
    } catch { }

    console.warn("[DevToolsHotkey] Could not find DevTools API. Make sure you're on Discord Desktop / Vesktop. Try Ctrl+Shift+I as fallback.");
    return false;
}

const settings = definePluginSettings({
    ctrlShiftI: {
        description: "Enable Ctrl+Shift+I hotkey",
        type: OptionType.BOOLEAN,
        default: true,
    },
    f12: {
        description: "Enable F12 hotkey",
        type: OptionType.BOOLEAN,
        default: true,
    },
});

function onKey(e: KeyboardEvent) {
    const isCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    let shouldOpen = false;

    // Always enabled: Ctrl+Shift+C
    if (isCtrl && e.shiftKey && key === "c") {
        shouldOpen = true;
    }
    // Optional: Ctrl+Shift+I
    else if (settings.store.ctrlShiftI && isCtrl && e.shiftKey && key === "i") {
        shouldOpen = true;
    }
    // Optional: F12
    else if (settings.store.f12 && e.key === "F12") {
        shouldOpen = true;
    }

    if (!shouldOpen) return;

    e.preventDefault();
    e.stopPropagation();
    // @ts-ignore - stopImmediatePropagation exists
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    openDevTools();
}

export default definePlugin({
    name: "DevToolsHotkey",
    description: "Opens DevTools on Ctrl+Shift+C (configurable Ctrl+Shift+I and F12)",
    authors: [Devs.noloverme],
    tags: ["Utility"],
    settings,

    start() {
        document.addEventListener("keydown", onKey, true);
    },

    stop() {
        document.removeEventListener("keydown", onKey, true);
    }
});
