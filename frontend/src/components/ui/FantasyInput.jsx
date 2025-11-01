import React from 'react';

/**
 * Fantasy-themed Input Component
 * A reusable input field with ornate fantasy styling
 */
export default function FantasyInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  className = '',
  id,
  name,
  autoComplete,
  onFocus,
  onBlur,
  ...props
}) {
  const inputId = id || `fantasy-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-amber-300 text-xs font-semibold uppercase tracking-wider"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full px-4 py-3 bg-amber-950/50 border-2 ${
          error
            ? 'border-red-600/70 focus:border-red-500 focus:ring-red-500/30'
            : 'border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20'
        } rounded-lg text-amber-200 placeholder-amber-600/50 focus:outline-none transition-all duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          boxShadow: error
            ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(239, 68, 68, 0.2)'
            : 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}
        {...props}
      />
      {error && (
        <div className="text-red-400 text-xs flex items-center gap-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

