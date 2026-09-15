"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type SnackbarKind = "success" | "error" | "info";

type SnackbarItem = {
  id: number;
  kind: SnackbarKind;
  message: string;
};

type SnackbarContextValue = {
  show: (kind: SnackbarKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const AUTO_DISMISS_MS = 10000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (kind: SnackbarKind, message: string) => {
      const id = ++nextId.current;
      setItems((current) => [...current.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<SnackbarContextValue>(
    () => ({
      show,
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div className="snackbar-viewport" aria-live="polite">
        {items.map((item) => (
          <div className={`snackbar ${item.kind}`} key={item.id}>
            <span className="snackbar-icon">
              {item.kind === "success" ? (
                <CheckCircle2 size={17} />
              ) : item.kind === "error" ? (
                <XCircle size={17} />
              ) : (
                <Info size={17} />
              )}
            </span>
            <span className="snackbar-message">{item.message}</span>
            <button
              type="button"
              className="snackbar-close"
              onClick={() => dismiss(item.id)}
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context)
    throw new Error("useSnackbar harus digunakan di dalam SnackbarProvider.");
  return context;
}