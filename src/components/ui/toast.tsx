import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Tiempo en ms antes de auto-cerrar. 0 = nunca. Default 5000. */
  durationMs?: number;
  action?: ToastAction;
}

export interface ActiveToast extends Required<Omit<ToastOptions, 'description' | 'action'>> {
  id: string;
  description?: string;
  action?: ToastAction;
}

interface ToastApi {
  show: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: 'border-stone-200 bg-white text-stone-800',
  success: 'border-brand-300 bg-brand-50 text-brand-900',
  warning: 'border-earth-300 bg-earth-50 text-earth-900',
  error: 'border-red-300 bg-red-50 text-red-900',
};

let lastId = 0;
function nextId(): string {
  lastId += 1;
  return `t-${lastId}-${Date.now().toString(36)}`;
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (opts: ToastOptions) => {
      const id = nextId();
      const duration = opts.durationMs ?? 5000;
      const toast: ActiveToast = {
        id,
        title: opts.title,
        description: opts.description,
        variant: opts.variant ?? 'default',
        durationMs: duration,
        action: opts.action,
      };
      setToasts((list) => [...list, toast]);
      if (duration > 0) {
        const tm = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, tm);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ActiveToast;
  onDismiss: () => void;
}): JSX.Element {
  const onActionClick = async () => {
    if (!toast.action) return;
    try {
      await toast.action.onClick();
    } finally {
      onDismiss();
    }
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md border px-3 py-2.5 text-sm shadow-card ${VARIANT_CLASS[toast.variant]}`}
    >
      <div className="flex-1">
        <div className="font-medium">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs opacity-80">{toast.description}</div>
        )}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => void onActionClick()}
          className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700 hover:bg-brand-100"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar"
        className="shrink-0 rounded p-0.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast: falta <ToastProvider /> arriba en el árbol.');
  return ctx;
}
