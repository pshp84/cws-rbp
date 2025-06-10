import { configureStore } from "@reduxjs/toolkit";
import HeaderBookmarkSlice from "./Reducers/HeaderBookmarkSlice";
import LayoutSlice from "./Reducers/LayoutSlice";
import ThemeCustomizerSlice from "./Reducers/ThemeCustomizerSlice";
import FilterSlice from "./Reducers/FilterSlice";
import ProductSlice from "./Reducers/ProductSlice";
import CartSlice from "./Reducers/CartSlice";

const Store = configureStore({
  reducer: {
    layout: LayoutSlice,

    headerBookMark: HeaderBookmarkSlice,
    themeCustomizer: ThemeCustomizerSlice,
    filterData: FilterSlice,
    product: ProductSlice,
    cartData: CartSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default Store;

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
