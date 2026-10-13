import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import apiService, {
  VerificationOrderItem, VerificationTeamMember,
  UpdateSalesOrderProductsPayload, StockWarningItem,
} from '../../service/apiService';

export type SalesOrderStatusFilter = 'ALL' | 'PENDING' | 'VERIFIED_ASUP' | 'PROCESSED' | 'CANCELLED';

interface VerificationState {
  items: VerificationOrderItem[];
  team: VerificationTeamMember[];
  pendingCount: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  actionLoadingId: number | null;
  error: string | null;
  search: string;
  statusFilter: SalesOrderStatusFilter;
  currentPage: number;
  lastPage: number;
  total: number;
  // Warning stok terakhir dari update produk, dibaca sekali oleh screen edit lalu
  // ditampilkan sebagai alert (bukan disimpan permanen per-PO).
  lastStockWarnings: StockWarningItem[];
}

const initialState: VerificationState = {
  items: [],
  team: [],
  pendingCount: 0,
  loading: false,
  loadingMore: false,
  refreshing: false,
  actionLoadingId: null,
  error: null,
  search: '',
  statusFilter: 'PENDING', // default langsung nunjukin yang butuh di-review
  currentPage: 1,
  lastPage: 1,
  total: 0,
  lastStockWarnings: [],
};

interface FetchArgs {
  page?: number;
  isRefresh?: boolean;
  isLoadMore?: boolean;
}

export const fetchVerificationList = createAsyncThunk(
  'salesOrderVerification/fetchList',
  async ({ page = 1, isRefresh = false, isLoadMore = false }: FetchArgs, { getState, rejectWithValue }) => {
    const state = getState() as { salesOrderVerification: VerificationState };
    const { search, statusFilter } = state.salesOrderVerification;

    const params: Record<string, string | number> = { page, per_page: 15 };
    if (search) params.search = search;
    if (statusFilter !== 'ALL') params.status = statusFilter;

    const res = await apiService.getVerificationList(params);
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Gagal memuat daftar verifikasi PO');
    }
    return { ...res.data, isRefresh, isLoadMore };
  }
);

export const fetchVerificationSummary = createAsyncThunk(
  'salesOrderVerification/fetchSummary',
  async (_, { rejectWithValue }) => {
    const res = await apiService.getVerificationSummary();
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Gagal memuat ringkasan verifikasi');
    }
    return res.data;
  }
);

export const fetchVerificationTeam = createAsyncThunk(
  'salesOrderVerification/fetchTeam',
  async (_, { rejectWithValue }) => {
    const res = await apiService.getVerificationTeam();
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Gagal memuat data tim');
    }
    return res.data.members;
  }
);

export const approveOrder = createAsyncThunk(
  'salesOrderVerification/approve',
  async (id: number, { rejectWithValue }) => {
    const res = await apiService.approveVerification(id);
    if (!res.success) {
      return rejectWithValue(res.message || 'Gagal meng-ACC PO');
    }
    return id;
  }
);

export const cancelOrder = createAsyncThunk(
  'salesOrderVerification/cancel',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    const res = await apiService.cancelVerification(id, reason);
    if (!res.success) {
      return rejectWithValue(res.message || 'Gagal membatalkan PO');
    }
    return id;
  }
);

// ASUP mengedit produk PO PENDING (tambah/hapus artikel, ubah qty/harga).
// Setelah sukses: total_qty_pack, bruto_amount, netto_amount di item list
// di-refresh dari data terbaru yang dikembalikan server.
export const updateOrderProducts = createAsyncThunk(
  'salesOrderVerification/updateProducts',
  async ({ id, payload }: { id: number; payload: UpdateSalesOrderProductsPayload }, { rejectWithValue }) => {
    const res = await apiService.updateVerificationProducts(id, payload);
    if (!res.success) {
      return rejectWithValue(res.message || 'Gagal memperbarui produk PO');
    }
    return { id, data: res.data, stockWarnings: res.stock_warnings || [] };
  }
);

const salesOrderVerificationSlice = createSlice({
  name: 'salesOrderVerification',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<SalesOrderStatusFilter>) {
      state.statusFilter = action.payload;
    },
    clearStockWarnings(state) {
      state.lastStockWarnings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerificationList.pending, (state, action) => {
        const { isRefresh, isLoadMore } = action.meta.arg;
        if (isRefresh) state.refreshing = true;
        else if (isLoadMore) state.loadingMore = true;
        else state.loading = true;
        state.error = null;
      })
      .addCase(fetchVerificationList.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.currentPage = payload.current_page;
        state.lastPage = payload.last_page;
        state.total = payload.total;
        state.items = payload.isLoadMore ? [...state.items, ...payload.data] : payload.data;
      })
      .addCase(fetchVerificationList.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = (action.payload as string) || 'Terjadi kesalahan';
      })
      .addCase(fetchVerificationSummary.fulfilled, (state, action) => {
        state.pendingCount = action.payload.pending_count;
      })
      .addCase(fetchVerificationTeam.fulfilled, (state, action) => {
        state.team = action.payload;
      })
      .addCase(approveOrder.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
      })
      .addCase(approveOrder.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const item = state.items.find((i) => i.id === action.payload);
        if (item) item.status = 'VERIFIED_ASUP' as unknown as VerificationOrderItem['status'];
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(approveOrder.rejected, (state) => {
        state.actionLoadingId = null;
      })
      .addCase(cancelOrder.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg.id;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const item = state.items.find((i) => i.id === action.payload);
        if (item) item.status = 'CANCELLED';
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(cancelOrder.rejected, (state) => {
        state.actionLoadingId = null;
      })
      .addCase(updateOrderProducts.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg.id;
      })
      .addCase(updateOrderProducts.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const { id, data, stockWarnings } = action.payload;
        const item = state.items.find((i) => i.id === id);
        if (item && data) {
          item.total_qty_pack = data.total_qty_pack;
          item.bruto_amount = data.bruto_amount;
          item.netto_amount = data.netto_amount;
        }
        state.lastStockWarnings = stockWarnings;
      })
      .addCase(updateOrderProducts.rejected, (state) => {
        state.actionLoadingId = null;
      });
  },
});

export const { setSearch, setStatusFilter, clearStockWarnings } = salesOrderVerificationSlice.actions;
export default salesOrderVerificationSlice.reducer;