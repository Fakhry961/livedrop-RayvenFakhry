// src/components/atoms/Button.tsx
import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
}

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ')
}

export default function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const base =
    'rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-gray-400',
    ghost: 'text-gray-900 hover:bg-gray-50 focus:ring-gray-300',
  }

  return <button className={cx(base, variants[variant], className)} {...props} />
}
