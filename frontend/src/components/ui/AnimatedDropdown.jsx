import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

function normalizeOptions(options) {
  return options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return {
      value: String(opt.value),
      label: opt.label,
      description: opt.description || '',
    }
  })
}

export default function AnimatedDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  size = 'md',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  const normalizedOptions = useMemo(() => normalizeOptions(options || []), [options])

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))
  const selectedLabel = selectedOption ? selectedOption.label : placeholder

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current || rootRef.current.contains(event.target)) return
      setIsOpen(false)
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  const compact = size === 'sm'

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <motion.button
        type='button'
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.99 }}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg text-left transition-all ${
          compact ? 'px-3 py-2 text-xs font-semibold' : 'px-4 py-2.5 text-sm font-medium'
        }`}
        style={{
          background: 'var(--bg-surface-2)',
          color: disabled ? 'var(--text-faint)' : 'var(--text)',
          border: '1px solid var(--border-hi)',
          boxShadow: isOpen ? '0 0 0 1px var(--accent)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
        }}
      >
        <span className='truncate'>{selectedLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className={compact ? 'h-4 w-4' : 'h-5 w-5'} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className='absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg ft-scrollbar'
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hi)',
              boxShadow: '0 12px 30px rgba(2,6,23,0.35)',
            }}
          >
            {normalizedOptions.map((opt, idx) => {
              const selected = String(opt.value) === String(value)
              return (
                <motion.button
                  key={opt.value}
                  type='button'
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.16, delay: idx * 0.03 }}
                  onClick={() => {
                    onChange(String(opt.value))
                    setIsOpen(false)
                  }}
                  className={`group flex w-full items-center justify-between text-left transition-colors ${
                    compact ? 'px-3 py-2' : 'px-4 py-3'
                  }`}
                  style={{
                    color: 'var(--text)',
                    borderBottom: idx !== normalizedOptions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className='min-w-0'>
                    <div className={`truncate ${compact ? 'text-xs font-semibold' : 'text-sm font-medium'}`}>
                      {opt.label}
                    </div>
                    {opt.description && !compact && (
                      <div className='truncate text-xs' style={{ color: 'var(--text-muted)' }}>
                        {opt.description}
                      </div>
                    )}
                  </div>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Check className={compact ? 'h-4 w-4' : 'h-5 w-5'} style={{ color: 'var(--accent)' }} />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
