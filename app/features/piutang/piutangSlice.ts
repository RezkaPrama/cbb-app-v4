import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService, { MyPaymentItem } from '../../service/apiService';

export type StatusFilter = 'ALL' | 'BELUM POSTING' | 'Verified' | 'Posted';

interface PiutangState {
  items: MyPaymentItem[];
  currentPage: number;
  lastPage: number;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  search: string;
  statusFilter: StatusFilter;
}

const initialState: PiutangState = {
  items: [],
  currentPage: 1,
  lastPage: 1,
  total: 0,
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
  search: '',
  statusFilter: 'ALL',
};

interface FetchArgs {
  page?: number;
  isRefresh?: boolean;
  isLoadMore?: boolean;
}

export const fetchMyPayments = createAsyncThunk(
  'piutang/fetchMyPayments',
  async (args: FetchArgs, { getState, rejectWithValue }) => {
    const state = getState() as { piutang: PiutangState };
    const { search, statusFilter } = state.piutang;

    const params: Record<string, string | number> = {
      page: args.page ?? 1,
      per_page: 15,
    };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'ALL') params.status = statusFilter;

    const res = await apiService.getMyPiutangPayments(params);
    if (!res.success) {
      return rejectWithValue(res.message || 'Gagal memuat riwayat pembayaran');
    }
    return { ...res, isLoadMore: args.isLoadMore ?? false };
  }
);

const piutangSlice = createSlice({
  name: 'piutang',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
    },
    resetPiutangList(state) {
      state.items = [];
      state.currentPage = 1;
      state.lastPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPayments.pending, (state, action) => {
        if (action.meta.arg.isRefresh) state.refreshing = true;
        else if (action.meta.arg.isLoadMore) state.loadingMore = true;
        else state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPayments.fulfilled, (state, action) => {
        const payload = action.payload as any;
        const data: MyPaymentItem[] = payload.data ?? [];
        const meta = payload.meta ?? { current_page: 1, last_page: 1, total: data.length };

        state.items = payload.isLoadMore ? [...state.items, ...data] : data;
        state.currentPage = meta.current_page;
        state.lastPage = meta.last_page;
        state.total = meta.total;

        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
      })
      .addCase(fetchMyPayments.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
        state.error = (action.payload as string) || 'Gagal memuat riwayat pembayaran';
      });
  },
});

export const { setSearch, setStatusFilter, resetPiutangList } = piutangSlice.actions;
export default piutangSlice.reducer;