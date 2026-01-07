import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from '../lib/utils'

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' },
) {
  const { className, variant = 'primary', ...rest } = props
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-indigo-500 text-white hover:bg-indigo-400'
      : variant === 'danger'
        ? 'bg-rose-600 text-white hover:bg-rose-500'
        : 'bg-white/5 text-white hover:bg-white/10'
  return <button className={cx(base, styles, className)} {...rest} />
}

export function Field(props: { label: string; children: ReactNode; hint?: string; className?: string }) {
  const { label, children, hint, className } = props
  return (
    <div className={cx('block', className)}>
      <div className="mb-1 text-xs font-medium text-slate-300">{label}</div>
      {children}
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      className={cx(
        'w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400',
        className,
      )}
      {...rest}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return (
    <textarea
      className={cx(
        'w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400',
        className,
      )}
      {...rest}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props
  return (
    <select
      className={cx(
        'w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400',
        className,
      )}
      {...rest}
    />
  )
}

export function Badge(props: { children: ReactNode; tone?: 'green' | 'red' | 'slate' | 'amber' }) {
  const tone = props.tone ?? 'slate'
  const cls =
    tone === 'green'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
      : tone === 'red'
        ? 'bg-rose-500/15 text-rose-200 border-rose-500/30'
        : tone === 'amber'
          ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
          : 'bg-white/5 text-slate-200 border-white/10'

  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', cls)}>{props.children}</span>
}


