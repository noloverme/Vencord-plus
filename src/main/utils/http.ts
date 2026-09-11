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

import { createWriteStream } from "original-fs";
import { Readable } from "stream";
import { finished } from "stream/promises";

type Url = string | URL;

const REQUEST_TIMEOUT_MS = 25000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 750;

function getFetcher(): typeof fetch {
    try {
        // Electron's net.fetch respects system proxy settings,
        // while Node's global fetch (undici) does not and fails
        // with ConnectTimeoutError behind proxies / VPN / DPI tools.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { net } = require("electron");
        if (net?.fetch) return net.fetch.bind(net);
    } catch { }
    return fetch;
}

function withTimeout(signal?: AbortSignal | null): AbortSignal {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    if (!signal) return timeout;
    const anySignal = (AbortSignal as any).any;
    return typeof anySignal === "function" ? anySignal.call(AbortSignal, [signal, timeout]) : timeout;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function isRetryableError(err: unknown, res?: Response) {
    if (res) {
        // Retry on rate limits and transient server errors
        return res.status === 429 || res.status >= 500;
    }
    const msg = String(err);
    return /ConnectTimeout|Timeout|ECONNRESET|ENOTFOUND|EAI_AGAIN|EPIPE|UND_ERR|fetch failed/i.test(msg);
}

export async function checkedFetch(url: Url, options?: RequestInit, retries = MAX_RETRIES) {
    const fetcher = getFetcher();
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        let res: Response;
        try {
            res = await fetcher(url as string, {
                ...options,
                signal: withTimeout(options?.signal)
            });
        } catch (err) {
            if (err instanceof Error && err.cause) {
                err = err.cause;
            }
            lastError = err;

            const method = options?.method ?? "GET";
            if (attempt < retries && isRetryableError(err)) {
                await sleep(RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            throw new Error(
                `${method} ${url} failed: ${err}\n` +
                "Hint: check VPN / antivirus / firewall / DPI-bypass tools (GoodbyeDPI, zapret) - they often block Electron's network but not the browser."
            );
        }

        if (res!.ok) {
            return res!;
        }

        // Retry transient HTTP errors once
        if (attempt < retries && isRetryableError(lastError, res!)) {
            try { await res!.text(); } catch { }
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
        }

        let message = `${options?.method ?? "GET"} ${url}: ${res!.status} ${res!.statusText}`;
        try {
            const reason = await res!.text();
            message += `\n${reason}`;
        } catch { }

        throw new Error(message);
    }

    throw lastError instanceof Error ? lastError : new Error(`GET ${url} failed after ${retries + 1} attempts: ${lastError}`);
}

export async function fetchJson<T = any>(url: Url, options?: RequestInit) {
    const res = await checkedFetch(url, options);
    return res.json() as Promise<T>;
}

export async function fetchBuffer(url: Url, options?: RequestInit) {
    const res = await checkedFetch(url, options);
    const buf = await res.arrayBuffer();

    return Buffer.from(buf);
}

export async function downloadToFile(url: Url, path: string, options?: RequestInit) {
    const res = await checkedFetch(url, options);
    if (!res.body) {
        throw new Error(`Download ${url}: response body is empty`);
    }

    // @ts-expect-error weird type conflict
    const body = Readable.fromWeb(res.body);
    await finished(body.pipe(createWriteStream(path)));
}
