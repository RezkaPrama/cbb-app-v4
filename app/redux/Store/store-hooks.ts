import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import Store from '../Store/Store';
// ^ sesuaikan path ini ke lokasi Store.js Anda (mis. './Store' atau '../Store')

// Infer otomatis dari Store.js yang sudah ada — tidak perlu ubah Store.js sama sekali
export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;

// Pakai ini menggantikan useDispatch/useSelector polos di semua screen
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;