import { PLATFORM, type Platform } from '../store/platformStore';

export interface PlatformInfo {
    platform: Platform;
    isIOS: boolean;
    isAndroid: boolean;
    isWeb: boolean;
}

export function usePlatform(): PlatformInfo {
    return {
        platform: PLATFORM,
        isIOS: PLATFORM !== 'android',
        isAndroid: PLATFORM === 'android',
        isWeb: PLATFORM === 'web',
    };
}
