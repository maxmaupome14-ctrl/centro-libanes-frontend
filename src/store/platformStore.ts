import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

function detectPlatform(): Platform {
    try {
        const cap = Capacitor.getPlatform();
        if (cap === 'ios') return 'ios';
        if (cap === 'android') return 'android';
    } catch { /* not running in Capacitor */ }

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'ios';
    if (/Android/.test(navigator.userAgent)) return 'android';

    return 'web';
}

export const PLATFORM: Platform = detectPlatform();
