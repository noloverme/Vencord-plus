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

import { fetchBuffer, fetchJson } from "@main/utils/http";
import { IpcEvents } from "@shared/IpcEvents";
import { VENCORD_USER_AGENT } from "@shared/vencordUserAgent";
import { ipcMain } from "electron";
import { writeFile } from "fs/promises";
import { join } from "path";

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

import { serializeErrors, VENCORD_FILES } from "./common";

const API_BASE = `https://api.github.com/repos/${gitRemote}`;
let PendingUpdates = [] as [string, string][];

async function githubGet<T = any>(endpoint: string) {
    return fetchJson<T>(API_BASE + endpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            // "All API requests MUST include a valid User-Agent header.
            // Requests with no User-Agent header will be rejected."
            "User-Agent": VENCORD_USER_AGENT
        }
    });
}

function extractHashFromReleaseName(name: string): string | null {
    // Upstream format: "DevBuild 0850f37", fork format: "Vencord-plus 27e9c73" / "v1.0.1 27e9c73"
    const m = /(?:^|\s)([0-9a-f]{7,40})\s*$/i.exec(name.trim());
    return m ? m[1].slice(0, 7) : null;
}

async function resolveReleaseHash(release: any): Promise<string | null> {
    const fromName = release?.name ? extractHashFromReleaseName(String(release.name)) : null;
    if (fromName) return fromName;

    // Fallback for releases named plain "v1.0.1": resolve the tag to a commit sha
    const tag = release?.tag_name ? String(release.tag_name) : null;
    if (tag) {
        try {
            const commit = await githubGet(`/commits/${encodeURIComponent(tag)}`);
            if (commit?.sha) return String(commit.sha).slice(0, 7);
        } catch { }
    }
    return null;
}

async function calculateGitChanges() {
    const isOutdated = await fetchUpdates();
    if (!isOutdated) return [];

    try {
        const data = await githubGet(`/compare/${gitHash}...HEAD`);

        return data.commits.map((c: any) => ({
            // github api only sends the long sha
            hash: c.sha.slice(0, 7),
            author: c.author?.login ?? c.commit?.author?.name ?? "Unknown Author",
            message: c.commit.message.split("\n")[0]
        }));
    } catch (err) {
        // Compare fails when local hash is not in the remote history
        // (shallow/custom builds). Still report an update so the UI
        // offers to download the latest release assets.
        const latest: any = await githubGet("/releases/latest").catch(() => null);
        const body: string = latest?.body ? String(latest.body) : String((err as Error)?.message ?? err);
        return [{
            hash: latest ? (await resolveReleaseHash(latest) ?? "latest") : "latest",
            author: latest?.author?.login ?? "Unknown Author",
            message: body.split("\n")[0].slice(0, 200) || "New release available"
        }];
    }
}

async function fetchUpdates() {
    // Reset on every check, otherwise repeated checks duplicate entries
    PendingUpdates = [];

    const data = await githubGet("/releases/latest");

    const hash = await resolveReleaseHash(data);
    if (hash && hash === gitHash.slice(0, 7))
        return false;

    // If the release has no resolvable hash (old custom release),
    // still treat as outdated so users can update once to the fixed naming.
    data.assets.forEach(({ name, browser_download_url }) => {
        if (VENCORD_FILES.some(s => name.startsWith(s))) {
            PendingUpdates.push([name, browser_download_url]);
        }
    });

    return true;
}

async function applyUpdates() {
    const fileContents = await Promise.all(PendingUpdates.map(async ([name, url]) => {
        const contents = await fetchBuffer(url);
        return [join(__dirname, name), contents] as const;
    }));

    await Promise.all(fileContents.map(async ([filename, contents]) =>
        writeFile(filename, contents))
    );

    PendingUpdates = [];
    return true;
}

ipcMain.handle(IpcEvents.GET_REPO, serializeErrors(() => `https://github.com/${gitRemote}`));
ipcMain.handle(IpcEvents.GET_UPDATES, serializeErrors(calculateGitChanges));
ipcMain.handle(IpcEvents.UPDATE, serializeErrors(fetchUpdates));
ipcMain.handle(IpcEvents.BUILD, serializeErrors(applyUpdates));
