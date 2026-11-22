import type { ReactNode } from 'react'

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-900',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  icon?: ReactNode
}

export function Button({ variant = 'primary', className = '', icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
