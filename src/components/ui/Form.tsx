export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 pt-2">{children}</div>
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>
}

export function FormStack({ children }: { children: React.ReactNode }) {
  return <form className="space-y-3">{children}</form>
}
