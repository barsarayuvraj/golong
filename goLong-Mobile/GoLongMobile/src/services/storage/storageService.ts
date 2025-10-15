// GoLong Mobile App Storage Service

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

export class StorageService {
  // Secure storage for sensitive data
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  }

  async getBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  }

  // Regular storage for non-sensitive data
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return user ? JSON.parse(user) : null;
  }

  async setStreaks(streaks: any[]): Promise<void> {
    await AsyncStorage.setItem('streaks', JSON.stringify(streaks));
  }

  async getStreaks(): Promise<any[]> {
    const streaks = await AsyncStorage.getItem('streaks');
    return streaks ? JSON.parse(streaks) : [];
  }

  async setOfflineCheckins(checkins: any[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_CHECKINS, JSON.stringify(checkins));
  }

  async getOfflineCheckins(): Promise<any[]> {
    const checkins = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CHECKINS);
    return checkins ? JSON.parse(checkins) : [];
  }

  async addOfflineCheckin(checkin: any): Promise<void> {
    const checkins = await this.getOfflineCheckins();
    checkins.push(checkin);
    await this.setOfflineCheckins(checkins);
  }

  async clearOfflineCheckins(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_CHECKINS);
  }

  async setNotificationSettings(settings: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  }

  async getNotificationSettings(): Promise<any> {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return settings ? JSON.parse(settings) : {
      pushNotifications: true,
      emailNotifications: true,
      streakReminders: true,
      milestoneNotifications: true,
      socialNotifications: true
    };
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
  }
}

export const storageService = new StorageService();



