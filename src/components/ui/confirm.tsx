import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Label } from './label';
import { Textarea } from './textarea';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** True para resaltar la acción como destructiva (botón terracota). */
  destructive?: boolean;
}

export interface PromptOptions {
  title: string;
  description?: string;
  inputLabel: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  /** Si true, no permite enviar string vacío. */
  required?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
type PromptFn = (opts: PromptOptions) => Promise<string | null>;

interface DialogsApi {
  confirm: ConfirmFn;
  prompt: PromptFn;
}

const DialogsContext = createContext<DialogsApi | null>(null);

type Pending =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; opts: PromptOptions; resolve: (v: string | null) => void };

export function ConfirmProvider({ children }: { children: ReactNode }): JSX.Element {
  const [pending, setPending] = useState<Pending | null>(null);
  const [text, setText] = useState('');

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setPending({ kind: 'confirm', opts, resolve });
      }),
    [],
  );

  const promptFn = useCallback<PromptFn>(
    (opts) =>
      new Promise<string | null>((resolve) => {
        setText(opts.initialValue ?? '');
        setPending({ kind: 'prompt', opts, resolve });
      }),
    [],
  );

  const closeWith = (value: boolean | string | null) => {
    if (!pending) return;
    if (pending.kind === 'confirm') pending.resolve(value as boolean);
    else pending.resolve(value as string | null);
    setPending(null);
  };

  const onSubmit = () => {
    if (!pending) return;
    if (pending.kind === 'confirm') closeWith(true);
    else {
      const trimmed = text.trim();
      if (pending.opts.required && !trimmed) return;
      closeWith(trimmed.length > 0 ? trimmed : pending.opts.required ? trimmed : null);
    }
  };

  return (
    <DialogsContext.Provider value={{ confirm, prompt: promptFn }}>
      {children}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && closeWith(pending?.kind === 'confirm' ? false : null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pending?.opts.title ?? ''}</DialogTitle>
            {pending?.opts.description && (
              <DialogDescription>{pending.opts.description}</DialogDescription>
            )}
          </DialogHeader>
          {pending?.kind === 'prompt' && (
            <div className="grid gap-1.5">
              <Label htmlFor="prompt-input">{pending.opts.inputLabel}</Label>
              <Textarea
                id="prompt-input"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={pending.opts.placeholder}
                autoFocus
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => closeWith(pending?.kind === 'confirm' ? false : null)}
            >
              {pending?.opts.cancelText ?? 'Cancelar'}
            </Button>
            <Button
              variant={
                pending?.kind === 'confirm' && pending.opts.destructive
                  ? 'destructive'
                  : 'default'
              }
              type="button"
              onClick={onSubmit}
              disabled={
                pending?.kind === 'prompt' &&
                pending.opts.required === true &&
                text.trim().length === 0
              }
              autoFocus={pending?.kind === 'confirm'}
            >
              {pending?.opts.confirmText ?? 'Aceptar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogsContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(DialogsContext);
  if (!ctx) {
    throw new Error('useConfirm: falta <ConfirmProvider /> arriba en el árbol.');
  }
  return ctx.confirm;
}

export function usePrompt(): PromptFn {
  const ctx = useContext(DialogsContext);
  if (!ctx) {
    throw new Error('usePrompt: falta <ConfirmProvider /> arriba en el árbol.');
  }
  return ctx.prompt;
}
