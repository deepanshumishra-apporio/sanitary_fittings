"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { getAccessToken } from "@/lib/api";

function StoreInit() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (getAccessToken()) {
      store.dispatch(fetchCurrentUser());
    }
  }, []);

  return null;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StoreInit />
      {children}
    </Provider>
  );
}
