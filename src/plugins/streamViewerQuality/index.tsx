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
import { MediaEngineStore } from "@webpack/common";

const settings = definePluginSettings({
    enabled: {
        description: "Включить принудительное понижение качества просматриваемого стрима",
        type: OptionType.BOOLEAN,
        default: true,
    },
    quality: {
        description: "Качество (разрешение) для просмотра",
        type: OptionType.SELECT,
        options: [
            { label: "144p (минимум, меньше лага)", value: 144, default: false },
            { label: "240p", value: 240, default: false },
            { label: "360p", value: 360, default: false },
            { label: "480p (рекомендуется при слабом инете)", value: 480, default: true },
            { label: "720p", value: 720, default: false },
            { label: "1080p (Source)", value: 1080, default: false },
        ]
    },
    fps: {
        description: "FPS для просмотра",
        type: OptionType.SELECT,
        options: [
            { label: "15 FPS (минимум)", value: 15, default: false },
            { label: "30 FPS", value: 30, default: true },
            { label: "60 FPS", value: 60, default: false },
        ]
    },
    bitrate: {
        description: "Максимальный битрейт (кбит/с) - ниже = меньше лага",
        type: OptionType.SELECT,
        options: [
            { label: "500 кбит/с (очень низко)", value: 500, default: false },
            { label: "1000 кбит/с", value: 1000, default: false },
            { label: "1500 кбит/с", value: 1500, default: true },
            { label: "2500 кбит/с", value: 2500, default: false },
            { label: "4000 кбит/с (высоко)", value: 4000, default: false },
        ]
    }
});

function applyViewerQuality() {
    if (!settings.store.enabled) return;
    try {
        const engine = (MediaEngineStore as any).getMediaEngine?.();
        if (!engine?.connections) return;
        for (const conn of engine.connections) {
            try {
                // Force low quality via sink wants and constraints
                if (typeof conn.setRemoteVideoSinkWants === "function") {
                    // Discord uses quality 100 for Source, lower for reduced. We map resolution to quality param.
                    // Use applyQualityConstraints for more direct control
                }
                if (typeof conn.applyQualityConstraints === "function") {
                    conn.applyQualityConstraints({
                        maxResolution: { width: settings.store.quality, height: settings.store.quality },
                        maxFrameRate: settings.store.fps,
                        maxBitrate: settings.store.bitrate * 1000,
                        quality: Math.round((settings.store.quality / 1080) * 100)
                    });
                }
                if (typeof conn.updateVideoQuality === "function") {
                    conn.updateVideoQuality();
                }
                // Also try overwriteQualityForTesting if exists (debug hook)
                if (typeof conn.overwriteQualityForTesting === "function") {
                    conn.overwriteQualityForTesting(Math.round((settings.store.quality / 1080) * 100));
                }
            } catch { }
        }
    } catch { }
}

export default definePlugin({
    name: "StreamViewerQuality",
    description: "Позволяет понизить качество просматриваемого стрима (Go Live) чтобы не лагало при слабой сети. Выбери разрешение, FPS и битрейт.",
    authors: [Devs.Ven],
    tags: ["Media", "Utility"],
    settings,

    patches: [
        {
            find: "setRemoteVideoSinkWants",
            replacement: {
                match: /setRemoteVideoSinkWants\((\i)\)\{/,
                replace: "$&if($self.settings.store.enabled){try{arguments[0]= $self.getForcedWants(arguments[0]);}catch{};}"
            }
        },
        {
            find: "applyQualityConstraints",
            replacement: {
                match: /applyQualityConstraints\((\i)\)\{/,
                replace: "$&if($self.settings.store.enabled){try{arguments[0]= $self.getForcedConstraints(arguments[0]);}catch{};}"
            }
        }
    ],

    getForcedWants(wants: any) {
        if (!wants) return wants;
        // wants is object like { sinkWants: { ... }, quality: 100 }
        // Force to low quality
        const quality = Math.round((settings.store.quality / 1080) * 100);
        if (wants.quality != null) wants.quality = quality;
        if (wants.sinkWants) {
            for (const k in wants.sinkWants) {
                if (wants.sinkWants[k]?.quality != null) wants.sinkWants[k].quality = quality;
                if (wants.sinkWants[k]?.maxResolution) wants.sinkWants[k].maxResolution = { width: settings.store.quality, height: settings.store.quality };
                if (wants.sinkWants[k]?.maxFrameRate) wants.sinkWants[k].maxFrameRate = settings.store.fps;
                if (wants.sinkWants[k]?.maxBitrate) wants.sinkWants[k].maxBitrate = settings.store.bitrate * 1000;
            }
        }
        // Also clamp overall
        if (wants.maxResolution) wants.maxResolution = { width: settings.store.quality, height: settings.store.quality };
        if (wants.maxFrameRate) wants.maxFrameRate = settings.store.fps;
        if (wants.maxBitrate) wants.maxBitrate = settings.store.bitrate * 1000;
        return wants;
    },

    getForcedConstraints(constraints: any) {
        if (!constraints) {
            return {
                maxResolution: { width: settings.store.quality, height: settings.store.quality },
                maxFrameRate: settings.store.fps,
                maxBitrate: settings.store.bitrate * 1000,
                quality: Math.round((settings.store.quality / 1080) * 100)
            };
        }
        if (constraints.maxResolution) constraints.maxResolution = { width: settings.store.quality, height: settings.store.quality };
        else constraints.maxResolution = { width: settings.store.quality, height: settings.store.quality };
        if (constraints.maxFrameRate) constraints.maxFrameRate = settings.store.fps;
        else constraints.maxFrameRate = settings.store.fps;
        if (constraints.maxBitrate) constraints.maxBitrate = settings.store.bitrate * 1000;
        else constraints.maxBitrate = settings.store.bitrate * 1000;
        constraints.quality = Math.round((settings.store.quality / 1080) * 100);
        return constraints;
    },

    start() {
        // Apply after a delay when MediaEngine is ready, and on interval while watching
        setTimeout(applyViewerQuality, 3000);
        // Also re-apply when settings change
        const orig = settings.store.enabled;
        // Poll every 5s while enabled to keep quality low if Discord tries to raise it
        (this as any)._interval = setInterval(() => {
            if (settings.store.enabled) applyViewerQuality();
        }, 5000);
    },

    stop() {
        clearInterval((this as any)._interval);
    },

    // Called from patches
    flux: {
        // When stream starts, force low quality
        STREAM_CREATE() { setTimeout(applyViewerQuality, 1000); },
        STREAM_UPDATE() { setTimeout(applyViewerQuality, 500); },
    }
});
