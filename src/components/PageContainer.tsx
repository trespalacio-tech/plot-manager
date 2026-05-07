import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageContainer({ title, subtitle, children }: Props): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 md:py-9">
      <header className="mb-7">
        <h1 className="title-leaf text-[1.65rem] font-semibold leading-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
