import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Toast = { id: number; type: 'success' | 'error'; message: string }

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])

  const push = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current, { id, type, message }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 inset-x-4 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm ${
              item.type === 'success' ? 'bg-neutral-900 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
