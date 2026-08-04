import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import apiService, { SalesOrderListItem } from '../../service/apiService';

export type SalesOrderStatusFilter = 'ALL' | 'PENDING' | 'PROCESSED' | 'CANCELLED';

interface SalesOrderState {
  items: SalesOrderListItem[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  search: string;
  statusFilter: SalesOrderStatusFilter;
  currentPage: number;
  lastPage: number;
  total: number;
}

const initialState: SalesOrderState = {
  items: [],
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
  search: '',
  statusFilter: 'ALL',
  currentPage: 1,
  lastPage: 1,
  total: 0,
};

interface FetchArgs {
  page?: number;
  isRefresh?: boolean;
  isLoadMore?: boolean;
}

export const fetchSalesOrders = createAsyncThunk(
  'salesOrder/fetchList',
  async ({ page = 1, isRefresh = false, isLoadMore = false }: FetchArgs, { getState, rejectWithValue }) => {
    const state = getState() as { salesOrder: SalesOrderState };
    const { search, statusFilter } = state.salesOrder;

    const params: Record<string, string | number> = { page, per_page: 15 };
    if (search) params.search = search;
    if (statusFilter !== 'ALL') params.status = statusFilter;

    const res = await apiService.getSalesOrderList(params);
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Gagal memuat daftar PO');
    }
    return { ...res.data, isRefresh, isLoadMore };
  }
);

export const cancelSalesOrder = createAsyncThunk(
  'salesOrder/cancel',
  async (id: number, { rejectWithValue }) => {
    const res = await apiService.cancelSalesOrder(id);
    if (!res.success) {
      return rejectWithValue(res.message || 'Gagal membatalkan PO');
    }
    return id;
  }
);

const salesOrderSlice = createSlice({
  name: 'salesOrder',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<SalesOrderStatusFilter>) {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (state, action) => {
        const { isRefresh, isLoadMore } = action.meta.arg;
        if (isRefresh) state.refreshing = true;
        else if (isLoadMore) state.loadingMore = true;
        else state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.currentPage = payload.current_page;
        state.lastPage = payload.last_page;
        state.total = payload.total;
        state.items = payload.isLoadMore ? [...state.items, ...payload.data] : payload.data;
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = (action.payload as string) || 'Terjadi kesalahan';
      })
      .addCase(cancelSalesOrder.fulfilled, (state, action) => {
        const item = state.items.find((i) => i.id === action.payload);
        if (item) item.status = 'CANCELLED';
      });
  },
});

export const { setSearch, setStatusFilter } = salesOrderSlice.actions;
export default salesOrderSlice.reducer;