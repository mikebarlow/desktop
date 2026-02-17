import { session } from 'electron';
import state from './state.js';
import axios from 'axios';

export async function appendCookie() {
    const cookie = {
        url: `http://localhost:${state.phpPort}`,
        name: "_php_native",
        value: state.randomSecret,
    };

    await session.defaultSession.cookies.set(cookie);
}

export async function notifyLaravel(endpoint: string, payload = {}) {
    if (endpoint === 'events') {
        broadcastToWindows('native-event', payload);
    }

    try {
        await axios.post(
            `http://127.0.0.1:${state.phpPort}/_native/api/${endpoint}`,
            payload,
            {
                headers: {
                    "X-NativePHP-Secret": state.randomSecret,
                },
            }
        );
    } catch (e) {
        //
    }
}

export function broadcastToWindows(event, payload) {
    Object.values(state.windows).forEach(window => {
        window.webContents.send(event, payload);
    });

    if (state.activeMenuBar?.window) {
        state.activeMenuBar.window.webContents.send(event, payload);
    }
}

/**
 * Remove null and undefined values from an object
 */
export function trimOptions(options: any): any {
    Object.keys(options).forEach(key => options[key] == null && delete options[key]);

    return options;
}

export function appendWindowIdToUrl(url, id) {
    return url + (url.indexOf('?') === -1 ? '?' : '&') + '_windowId=' + id;
}

/**
 * Resolve a URL to an absolute form. Relative paths (e.g. /auth) are resolved
 * against the Laravel app server. Required because Electron's loadURL expects
 * absolute URLs.
 */
export function resolveUrl(url) {
    if (!url || typeof url !== 'string') {
        return url;
    }
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) {
        return trimmed;
    }
    const base = `http://127.0.0.1:${state.phpPort}`;
    return trimmed.startsWith('/') ? base + trimmed : `${base}/${trimmed}`;
}

export function goToUrl(url, windowId) {
    const absoluteUrl = resolveUrl(url);
    state.windows[windowId]?.loadURL(appendWindowIdToUrl(absoluteUrl, windowId));
}
