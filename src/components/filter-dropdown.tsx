'use client'

import { ChevronDown, Filter, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  className?: string
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  multiple = false,
  className = ''
}: FilterDropdownProps) {
  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue)
    }
    return value === optionValue
  }

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue === value ? '' : optionValue)
    }
  }

  const getButtonLabel = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      return `${label} (${value.length})`
    }
    if (!multiple && value) {
      const selectedOption = options.find(opt => opt.value === value)
      return selectedOption?.label || label
    }
    return label
  }

  const hasActiveFilters = multiple ? Array.isArray(value) && value.length > 0 : !!value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          className={cn("gap-2", className)}
        >
          <Filter className="h-4 w-4" />
          {getButtonLabel()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!multiple && (
          <DropdownMenuItem
            onClick={() => onChange('')}
            className="cursor-pointer"
          >
            <span className={cn("flex-1", !value && "font-medium")}>
              Alle
            </span>
            {!value && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        )}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="cursor-pointer"
          >
            <span className={cn("flex-1", isSelected(option.value) && "font-medium")}>
              {option.label}
            </span>
            {isSelected(option.value) && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}