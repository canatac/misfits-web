"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { Archive, Trash2, CheckCircle, X, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastAction {
  id: string;
  type: "archive" | "delete" | "read" | "star";
  message: string;
  undo: () => void;
  timestamp: number;
}

interface ToastContextType {
  addToast: (action: Omit<ToastAction, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
  toasts: ToastAction[];
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_DURATION = 5000;
const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastAction[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (action: Omit<ToastAction, "id" | "timestamp">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast: ToastAction = {
        ...action,
        id,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        const next = [...prev, newToast];
        return next.slice(-MAX_TOASTS);
      });

      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastAction[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastAction;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleUndo = () => {
    toast.undo();
    onDismiss(toast.id);
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const iconMap = {
    archive: <Archive className="h-4 w-4 text-[#C49B66]" />,
    delete: <Trash2 className="h-4 w-4 text-rose-500" />,
    read: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    star: <CheckCircle className="h-4 w-4 text-amber-500" />,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-[#242427] bg-[#121214] shadow-lg transition-all duration-200",
        isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0",
      )}
      role="alert"
    >
      {iconMap[toast.type]}
      <span className="flex-1 text-sm text-[#E0E0E0]">{toast.message}</span>
      <button
        onClick={handleUndo}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#C49B66] hover:bg-[#1D1D20] transition-colors"
      >
        <Undo2 className="h-3 w-3" />
        Annuler
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Close toast"
        className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-[#1D1D20] transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default ToastProvider;
