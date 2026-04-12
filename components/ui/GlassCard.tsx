// name=components/ui/GlassCard.tsx
'use client'

import { ReactNode } from 'react'
import { motion, MotionProps } from 'framer-motion'

interface GlassCardProps extends MotionProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

export function GlassCard({
  children,
  className = '',
  hoverable = true,
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card ${hoverable ? 'hover:border-[#00C2FF]/40 hover:shadow-[0_0_20px_rgba(0,194,255,0.1)]' : ''} transition-all ${className}`}
      whileHover={hoverable ? { y: -2 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}