import { STORAGE_KEYS } from '../constants/config';

export const storageService = {
  getUsername(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.USERNAME);
    } catch (error) {
      console.error('[Storage] Failed to get username:', error);
      return null;
    }
  },

  setUsername(username: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    } catch (error) {
      console.error('[Storage] Failed to save username:', error);
      throw new Error('Failed to save username');
    }
  },

  clearUsername(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
    } catch (error) {
      console.error('[Storage] Failed to clear username:', error);
    }
  },
};
