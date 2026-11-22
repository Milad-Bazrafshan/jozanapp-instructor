import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Field } from '@/components/ui/Field'
import { FormGrid } from '@/components/ui/Form'
import type { PersonInput } from '@/api/types'

export const emptyPerson: PersonInput = {
  firstName: '',
  lastName: '',
  nationalId: '',
  mobile: '',
  email: '',
  initialPassword: '',
}

export function PersonFields({
  person,
  onChange,
}: {
  person: PersonInput
  onChange: (person: PersonInput) => void
}) {
  const { t } = useTranslation()
  const set = (key: keyof PersonInput, value: string) => onChange({ ...person, [key]: value })
  return (
    <>
      <FormGrid>
        <Field label={t('users.firstName')} value={person.firstName} onChange={(value) => set('firstName', value)} />
        <Field label={t('users.lastName')} value={person.lastName} onChange={(value) => set('lastName', value)} />
      </FormGrid>
      <FormGrid>
        <Field label={t('users.nationalId')} value={person.nationalId ?? ''} onChange={(value) => set('nationalId', value)} required={false} />
        <Field label={t('users.mobile')} value={person.mobile ?? ''} onChange={(value) => set('mobile', value)} required={false} />
      </FormGrid>
      <Field label={t('people.loginEmail')} type="email" value={person.email ?? ''} onChange={(value) => set('email', value)} required={false} />
      {person.email ? (
        <Field label={t('users.initialPassword')} type="password" value={person.initialPassword ?? ''} onChange={(value) => set('initialPassword', value)} />
      ) : null}
    </>
  )
}

export function useQueryState(initial = '') {
  const [query, setQuery] = useState(initial)
  return { query, setQuery }
}
