'use client'
import type { FC } from 'react'
import React from 'react'
import classNames from 'classnames'

interface Props {
  className?: string
  checked?: boolean
  onCheck?: (checked: boolean) => void
  disabled?: boolean
}

const Checkbox: FC<Props> = ({
  className,
  checked = false,
  onCheck,
  disabled = false,
}) => {
  return (
    <input
      type="checkbox"
      className={classNames(
        'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      checked={checked}
      onChange={e => onCheck?.(e.target.checked)}
      disabled={disabled}
    />
  )
}

export default React.memo(Checkbox)
