// apiService.ts - TypeScript Version
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://citrabarubusana.org/api';

// ============ TYPE DEFINITIONS ============

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]> | null;
  needsLogin?: boolean;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: string | FormData;
  includeAuth?: boolean;
  isMultipart?: boolean;
}

interface PhotoFile {
  uri: string;
  type?: string;
  fileName?: string;
}

interface UserData {
  name?: string;
  email?: string;
  password?: string;
  [key: string]: unknown;
}

interface BranchData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

interface BranchOffice {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  long?: number;
  branch_name?: string;
  branch_address?: string;
}

interface AttendanceData {
  id?: number;
  user_id?: number;
  check_in_time?: string;
  check_out_time?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_out_latitude?: number;
  check_out_longitude?: number;
  check_in_address?: string;
  check_out_address?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface AttendanceStatusData {
  has_checked_in: boolean;
  has_checked_out: boolean;
  attendance?: AttendanceData;
}

interface SalesPOData {
  id?: number;
  [key: string]: unknown;
}

interface PurchasePOData {
  id?: number;
  [key: string]: unknown;
}

interface CustomerData {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

interface ProductData {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

interface SupplierData {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

interface FileUpload {
  uri: string;
  type: string;
  fileName?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  branch_id?: number;
  branch?: {
    id: number;
    name?: string;
  };
  position?: {
    id: number;
    name?: string;
  };
  department?: {
    id: number;
    name?: string;
  };
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: UserProfile;
  };
}

interface DashboardData {
  [key: string]: unknown;
}

interface AnalyticsData {
  [key: string]: unknown;
}

interface NotificationData {
  id: number;
  title?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
}

type QueryParams = Record<string, string | number | boolean>;

// ============ API SERVICE CLASS ============

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = BASE_URL;
  }

  // Helper method untuk mendapatkan token dari key yang benar
  async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('tokenUser');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Helper method untuk membuat headers
  async getHeaders(includeAuth = true, isMultipart = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method dengan error handling yang lebih baik
  async makeRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const isMultipart = options.isMultipart || false;
    const headers = await this.getHeaders(options.includeAuth !== false, isMultipart);

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = options.body;
    }

    try {
      console.log(`API Request: ${config.method} ${url}`);

      const response = await fetch(url, config);

      // Handle different response status codes
      if (response.status === 401) {
        await AsyncStorage.removeItem('tokenUser');
        await AsyncStorage.removeItem('dataDetailUser');
        return {
          success: false,
          message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          needsLogin: true
        };
      }

      const contentType = response.headers.get('content-type');
      let data: T | string;

      // Deteksi jika response adalah HTML (redirect ke login)
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON - likely redirected to login');
        await AsyncStorage.removeItem('tokenUser');
        await AsyncStorage.removeItem('dataDetailUser');
        return {
          success: false,
          message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          needsLogin: true
        };
      }

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        const errorData = data as ApiResponse<T>;
        return {
          success: false,
          message: errorData.message || `HTTP error! status: ${response.status}`,
          errors: errorData.errors || null,
        };
      }

      return data as ApiResponse<T>;

    } catch (error) {
      const err = error as Error;
      console.error('API Request Error:', err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan koneksi',
      };
    }
  }

  // ============ AUTHENTICATION APIs ============
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse['data']>> {
    return await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });
  }

  async register(userData: UserData): Promise<ApiResponse<UserProfile>> {
    return await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false,
    });
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      await AsyncStorage.removeItem('tokenUser');
      await AsyncStorage.removeItem('dataDetailUser');
    }
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return await this.makeRequest('/refresh', {
      method: 'POST',
    });
  }

  async getUserInfo(): Promise<ApiResponse<UserProfile>> {
    return await this.makeRequest('/user');
  }

  // ============ USER APIs ============
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return await this.makeRequest('/user/profile');
  }

  async updateUserProfile(userData: Partial<UserData>): Promise<ApiResponse<UserProfile>> {
    return await this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // ============ BRANCH OFFICE APIs ============
  async getBranches(params: QueryParams = {}): Promise<ApiResponse<BranchOffice[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/branch-office?${queryString}` : '/branch-office';
    return await this.makeRequest(endpoint, { includeAuth: false });
  }

  async getBranchById(id: number): Promise<ApiResponse<BranchOffice>> {
    return await this.makeRequest(`/branch-office/${id}`, { includeAuth: false });
  }

  async getNearbyBranches(
    latitude: number,
    longitude: number,
    radius = 5000
  ): Promise<ApiResponse<BranchOffice[]>> {
    const queryString = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    }).toString();
    return await this.makeRequest(`/branch-office/nearby/search?${queryString}`, { includeAuth: false });
  }

  async createBranch(branchData: BranchData): Promise<ApiResponse<BranchOffice>> {
    return await this.makeRequest('/branch-office', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  }

  async updateBranch(id: number, branchData: Partial<BranchData>): Promise<ApiResponse<BranchOffice>> {
    return await this.makeRequest(`/branch-office/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    });
  }

  async deleteBranch(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/branch-office/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ATTENDANCE APIs ============
  async checkIn(
    latitude: number,
    longitude: number,
    address: string | null = null,
    photo: PhotoFile | null = null,
    notes: string | null = null
  ): Promise<ApiResponse<{ attendance: AttendanceData }>> {
    const formData = new FormData();
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    if (address) {
      formData.append('address', address);
    }

    if (notes) {
      formData.append('notes', notes);
    }

    if (photo && photo.uri) {
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || `checkin_${Date.now()}.jpg`,
      } as unknown as Blob);
    }

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('Check-in request:', { latitude, longitude, address, hasPhoto: !!photo });

      const response = await fetch(`${this.baseURL}/attendance/check-in`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Check-in error:', data);
        return {
          success: false,
          message: data.message || 'Check-in gagal',
          errors: data.errors || null,
        };
      }

      console.log('Check-in success:', data);
      return data;

    } catch (error) {
      const err = error as Error;
      console.error('Check-in request error:', err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan saat check-in',
      };
    }
  }

  async checkOut(
    latitude: number,
    longitude: number,
    address: string | null = null,
    photo: PhotoFile | null = null,
    notes: string | null = null
  ): Promise<ApiResponse<{ attendance: AttendanceData }>> {
    const formData = new FormData();
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    if (address) {
      formData.append('address', address);
    }

    if (notes) {
      formData.append('notes', notes);
    }

    if (photo && photo.uri) {
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || `checkout_${Date.now()}.jpg`,
      } as unknown as Blob);
    }

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('Check-out request:', { latitude, longitude, address, hasPhoto: !!photo });

      const response = await fetch(`${this.baseURL}/attendance/check-out`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Check-out error:', data);
        return {
          success: false,
          message: data.message || 'Check-out gagal',
          errors: data.errors || null,
        };
      }

      console.log('Check-out success:', data);
      return data;

    } catch (error) {
      const err = error as Error;
      console.error('Check-out request error:', err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan saat check-out',
      };
    }
  }

  async getTodayAttendanceStatus(
    userId: number,
    token: string
  ): Promise<ApiResponse<AttendanceStatusData>> {
    if (!userId) {
      console.error('User ID is required for getTodayAttendanceStatus');
      return {
        success: false,
        message: 'User ID tidak tersedia'
      };
    }

    try {
      console.log('Token exists for attendance check:', !!token);

      if (!token) {
        console.error('No authentication token found');
        return {
          success: false,
          message: 'Token autentikasi tidak ditemukan. Silakan login kembali.',
          needsLogin: true
        };
      }

      const queryString = new URLSearchParams({ user_id: userId.toString() }).toString();

      const response = await this.makeRequest<AttendanceStatusData>(`/attendance/today?${queryString}`, {
        includeAuth: true
      });

      if (response?.needsLogin) {
        return response;
      }

      return response;

    } catch (error) {
      const err = error as Error;
      console.error('getTodayAttendanceStatus error:', err);
      return {
        success: false,
        message: err.message || 'Gagal mengambil status absensi'
      };
    }
  }

  async getTodayAttendanceStatusPost(userId: number): Promise<ApiResponse<AttendanceStatusData>> {
    if (!userId) {
      console.error('User ID is required for getTodayAttendanceStatus');
      return {
        success: false,
        message: 'User ID tidak tersedia'
      };
    }

    return await this.makeRequest('/attendance/today', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getAttendanceHistory(params: QueryParams = {}): Promise<ApiResponse<AttendanceData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/attendance/history?${queryString}` : '/attendance/history';
    return await this.makeRequest(endpoint);
  }

  async getAttendanceStatistics(params: QueryParams = {}): Promise<ApiResponse<unknown>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/attendance/statistics?${queryString}` : '/attendance/statistics';
    return await this.makeRequest(endpoint);
  }

  async getAttendanceDetail(id: number): Promise<ApiResponse<AttendanceData>> {
    return await this.makeRequest(`/attendance/${id}`);
  }

  // ============ SALES PO APIs ============
  async getSalesPOs(params: QueryParams = {}): Promise<ApiResponse<SalesPOData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/sales-po?${queryString}` : '/sales-po';
    return await this.makeRequest(endpoint);
  }

  async getSalesPOById(id: number): Promise<ApiResponse<SalesPOData>> {
    return await this.makeRequest(`/sales-po/${id}`);
  }

  async createSalesPO(salesPOData: SalesPOData): Promise<ApiResponse<SalesPOData>> {
    return await this.makeRequest('/sales-po', {
      method: 'POST',
      body: JSON.stringify(salesPOData),
    });
  }

  async updateSalesPO(id: number, salesPOData: Partial<SalesPOData>): Promise<ApiResponse<SalesPOData>> {
    return await this.makeRequest(`/sales-po/${id}`, {
      method: 'PUT',
      body: JSON.stringify(salesPOData),
    });
  }

  async deleteSalesPO(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/sales-po/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ PURCHASE PO APIs ============
  async getPurchasePOs(params: QueryParams = {}): Promise<ApiResponse<PurchasePOData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/purchase-po?${queryString}` : '/purchase-po';
    return await this.makeRequest(endpoint);
  }

  async getPurchasePOById(id: number): Promise<ApiResponse<PurchasePOData>> {
    return await this.makeRequest(`/purchase-po/${id}`);
  }

  async createPurchasePO(purchasePOData: PurchasePOData): Promise<ApiResponse<PurchasePOData>> {
    return await this.makeRequest('/purchase-po', {
      method: 'POST',
      body: JSON.stringify(purchasePOData),
    });
  }

  async updatePurchasePO(id: number, purchasePOData: Partial<PurchasePOData>): Promise<ApiResponse<PurchasePOData>> {
    return await this.makeRequest(`/purchase-po/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchasePOData),
    });
  }

  async deletePurchasePO(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/purchase-po/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ CUSTOMER APIs ============
  async getCustomers(params: QueryParams = {}): Promise<ApiResponse<CustomerData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    return await this.makeRequest(endpoint);
  }

  async getCustomerById(id: number): Promise<ApiResponse<CustomerData>> {
    return await this.makeRequest(`/customers/${id}`);
  }

  async createCustomer(customerData: CustomerData): Promise<ApiResponse<CustomerData>> {
    return await this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: number, customerData: Partial<CustomerData>): Promise<ApiResponse<CustomerData>> {
    return await this.makeRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ PRODUCT APIs ============
  async getProducts(params: QueryParams = {}): Promise<ApiResponse<ProductData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return await this.makeRequest(endpoint);
  }

  async getProductById(id: number): Promise<ApiResponse<ProductData>> {
    return await this.makeRequest(`/products/${id}`);
  }

  async createProduct(productData: ProductData): Promise<ApiResponse<ProductData>> {
    return await this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: number, productData: Partial<ProductData>): Promise<ApiResponse<ProductData>> {
    return await this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ SUPPLIER APIs ============
  async getSuppliers(params: QueryParams = {}): Promise<ApiResponse<SupplierData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return await this.makeRequest(endpoint);
  }

  async getSupplierById(id: number): Promise<ApiResponse<SupplierData>> {
    return await this.makeRequest(`/suppliers/${id}`);
  }

  async createSupplier(supplierData: SupplierData): Promise<ApiResponse<SupplierData>> {
    return await this.makeRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  }

  async updateSupplier(id: number, supplierData: Partial<SupplierData>): Promise<ApiResponse<SupplierData>> {
    return await this.makeRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  }

  async deleteSupplier(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ FILE UPLOAD API ============
  async uploadFile(file: FileUpload, uploadPath = '/upload'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.fileName || 'upload.jpg',
    } as unknown as Blob);

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${uploadPath}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const err = error as Error;
      console.error('File upload error:', err);
      throw err;
    }
  }

  // ============ SEARCH APIs ============
  async search(query: string, type = 'all'): Promise<ApiResponse<unknown[]>> {
    return await this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  }

  // ============ DASHBOARD/ANALYTICS APIs ============
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return await this.makeRequest('/dashboard');
  }

  async getAnalytics(params: QueryParams = {}): Promise<ApiResponse<AnalyticsData>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/analytics?${queryString}` : '/analytics';
    return await this.makeRequest(endpoint);
  }

  // ============ NOTIFICATION APIs ============
  async getNotifications(params: QueryParams = {}): Promise<ApiResponse<NotificationData[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    return await this.makeRequest(endpoint);
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse<NotificationData>> {
    return await this.makeRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async deleteNotification(id: number): Promise<ApiResponse<null>> {
    return await this.makeRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;

// Export the class and types for advanced usage
export { ApiService };
export type {
  ApiResponse,
  RequestOptions,
  PhotoFile,
  UserData,
  BranchData,
  BranchOffice,
  AttendanceData,
  AttendanceStatusData,
  SalesPOData,
  PurchasePOData,
  CustomerData,
  ProductData,
  SupplierData,
  FileUpload,
  UserProfile,
  LoginResponse,
  DashboardData,
  AnalyticsData,
  NotificationData,
  QueryParams,
};