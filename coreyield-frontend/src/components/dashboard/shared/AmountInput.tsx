import React from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  maxBalance?: string
  onMaxClick?: () => void
  disabled?: boolean
  error?: string
  token?: string
  className?: string
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = '0.0',
  label,
  maxBalance,
  onMaxClick,
  disabled = false,
  error,
  token,
  className = ''
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow empty string
    if (inputValue === '') {
      onChange('')
      return
    }
    
    // Allow only numbers and decimal point
    const regex = /^\d*\.?\d*$/
    if (regex.test(inputValue)) {
      onChange(inputValue)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
          {maxBalance && (
            <span className="text-sm text-gray-400">
              Available: {maxBalance} {token}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
            error 
              ? 'border-red-500 focus:border-red-400' 
              : 'border-gray-600 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        <div className="absolute right-3 top-3 flex items-center space-x-2">
          {token && (
            <span className="text-gray-400 text-sm font-medium">
              {token}
            </span>
          )}
          
          {onMaxClick && maxBalance && !disabled && (
            <button
              onClick={onMaxClick}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  )
}