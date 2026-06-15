import { I } from '../../icons'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, ...rest }: CheckboxProps) {
  return (
    <button
      type="button"
      className={checked ? 'checkbox checked' : 'checkbox'}
      onClick={onChange}
      aria-pressed={checked}
      {...rest}
    >
      {checked && I.check}
    </button>
  )
}
