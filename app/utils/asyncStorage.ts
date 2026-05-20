import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for user data structure
export interface UserData {
  id: number;
  username: string;
  name: string;
  email: string;
  position_name?: string;
  department_name?: string;
  branch_name?: string;
  position?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
}

// Define storage keys for type safety
export enum StorageKeys {
  TOKEN_USER = 'tokenUser',
  USER_DATA = 'dataDetailUser',
  USER_PREFERENCES = 'userPreferences',
}

// Generic type for storage operations
type StorageValue = string | number | boolean | object | null;

/**
 * Store data in AsyncStorage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns Promise<boolean> - Success status
 */
export const storeDataLara = async <T extends StorageValue>(
  key: string,
  value: T
): Promise<boolean> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error storing data for key "${key}":`, error);
    return false;
  }
};

/**
 * Get data from AsyncStorage
 * @param key - Storage key
 * @returns Promise<T | null> - Parsed value or null
 */
export const getDataLara = async <T = any>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue !== null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting data for key "${key}":`, error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 * @param key - Storage key
 * @returns Promise<boolean> - Success status
 */
export const removeDataLara = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing data for key "${key}":`, error);
    return false;
  }
};

/**
 * Clear all data from AsyncStorage
 * @returns Promise<boolean> - Success status
 */
export const clearAllData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};

/**
 * Get multiple items from AsyncStorage
 * @param keys - Array of storage keys
 * @returns Promise<Record<string, any>> - Object with key-value pairs
 */
export const getMultipleData = async (
  keys: string[]
): Promise<Record<string, any>> => {
  try {
    const result = await AsyncStorage.multiGet(keys);
    const data: Record<string, any> = {};
    
    result.forEach(([key, value]) => {
      if (value !== null) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error getting multiple data:', error);
    return {};
  }
};

/**
 * Store multiple items in AsyncStorage
 * @param items - Array of [key, value] pairs
 * @returns Promise<boolean> - Success status
 */
export const storeMultipleData = async (
  items: Array<[string, StorageValue]>
): Promise<boolean> => {
  try {
    const stringifiedItems: Array<[string, string]> = items.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(stringifiedItems);
    return true;
  } catch (error) {
    console.error('Error storing multiple data:', error);
    return false;
  }
};

/**
 * Get user token from storage
 * @returns Promise<string | null>
 */
export const getUserToken = async (): Promise<string | null> => {
  return await getDataLara<string>(StorageKeys.TOKEN_USER);
};

/**
 * Store user token
 * @param token - User authentication token
 * @returns Promise<boolean>
 */
export const setUserToken = async (token: string): Promise<boolean> => {
  return await storeDataLara(StorageKeys.TOKEN_USER, token);
};

/**
 * Get user data from storage
 * @returns Promise<UserData | null>
 */
export const getUserData = async (): Promise<UserData | null> => {
  return await getDataLara<UserData>(StorageKeys.USER_DATA);
};

/**
 * Store user data
 * @param userData - User data object
 * @returns Promise<boolean>
 */
export const setUserData = async (userData: UserData): Promise<boolean> => {
  return await storeDataLara(StorageKeys.USER_DATA, userData);
};

/**
 * Clear user session (token and user data)
 * @returns Promise<boolean>
 */
export const clearUserSession = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      StorageKeys.TOKEN_USER,
      StorageKeys.USER_DATA,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing user session:', error);
    return false;
  }
};

/**
 * Check if user is logged in
 * @returns Promise<boolean>
 */
export const isUserLoggedIn = async (): Promise<boolean> => {
  const token = await getUserToken();
  return token !== null && token !== '';
};

/**
 * Log user details for debugging
 * @returns Promise<UserData | null>
 */
export const logUserDetails = async (): Promise<UserData | null> => {
  try {
    const userData = await getUserData();
    
    if (userData) {
      console.log('===== User Details from Storage =====');
      console.log('ID:', userData.id);
      console.log('Username:', userData.username);
      console.log('Name:', userData.name);
      console.log('Email:', userData.email);
      
      // Log position details
      if (userData.position_name || userData.position) {
        console.log('\n--- Position ---');
        console.log('Position Name:', userData.position_name);
        console.log('Position Object:', userData.position);
      }
      
      // Log department details
      if (userData.department_name || userData.department) {
        console.log('\n--- Department ---');
        console.log('Department Name:', userData.department_name);
        console.log('Department Object:', userData.department);
      }
      
      // Log branch details
      if (userData.branch_name || userData.branch) {
        console.log('\n--- Branch ---');
        console.log('Branch Name:', userData.branch_name);
        console.log('Branch Object:', userData.branch);
      }
      
      console.log('=====================================\n');
    } else {
      console.log('No user data found in storage');
    }
    
    return userData;
  } catch (error) {
    console.error('Error logging user details:', error);
    return null;
  }
};

/**
 * Get all keys from AsyncStorage
 * @returns Promise<string[]>
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};

/**
 * Check if a key exists in AsyncStorage
 * @param key - Storage key
 * @returns Promise<boolean>
 */
export const hasKey = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    console.error(`Error checking key "${key}":`, error);
    return false;
  }
};

// Export default object with all functions
export default {
  storeDataLara,
  getDataLara,
  removeDataLara,
  clearAllData,
  getMultipleData,
  storeMultipleData,
  getUserToken,
  setUserToken,
  getUserData,
  setUserData,
  clearUserSession,
  isUserLoggedIn,
  logUserDetails,
  getAllKeys,
  hasKey,
};