import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const KEY_PREFIX = 'fifa_';

/**
 * Cross-platform session storage: localStorage on web, Capacitor Preferences on iOS/native.
 * Use this for auth session so it works in the native app shell.
 */
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const fullKey = KEY_PREFIX + key;
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: fullKey });
      return value;
    }
    return typeof localStorage !== 'undefined' ? localStorage.getItem(fullKey) : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: fullKey, value });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(fullKey, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: fullKey });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(fullKey);
    }
  },
};
