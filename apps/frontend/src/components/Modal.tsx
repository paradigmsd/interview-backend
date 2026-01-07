import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '../lib/utils'

export function Modal(props: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
}) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60"
        onClick={props.onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative w-full rounded-xl border border-white/10 bg-slate-950 shadow-2xl',
          props.widthClassName ?? 'max-w-xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold text-white">{props.title}</div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-300 hover:bg-white/5 hover:text-white"
            onClick={props.onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4">{props.children}</div>

        {props.footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
            {props.footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}


