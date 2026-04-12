// name=components/feed/AllocationPanel.tsx
'use client'

import { motion } from 'framer-motion'

const ALLOCATION_DATA = [
  { ministry: 'Infrastructure', amount: 45.2, percentage: 35, color: '#f59e0b' },
  { ministry: 'Health', amount: 28.5, percentage: 22, color: '#34d399' },
  { ministry: 'Education', amount: 32.1, percentage: 25, color: '#60a5fa' },
  { ministry: 'Defence', amount: 18.3, percentage: 14, color: '#f87171' },
  { ministry: 'Agriculture', amount: 4.9, percentage: 4, color: '#a3e635' },
]

export function AllocationPanel() {
  const total = ALLOCATION_DATA.reduce((sum, item) => sum + item.amount, 0)

  return (
    <motion.div
      className="glass-card p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-white mb-1">
          Budget Allocation
        </h3>
        <p className="text-xs text-white/40">FY 2081/82 Distribution</p>
      </div>

      {/* Total */}
      <div className="mb-6 pb-6 border-b border-white/[0.07]">
        <p className="text-xs text-white/50 mb-1">Total Budget</p>
        <p className="font-display text-2xl font-bold text-[#00C2FF]">
          NPR {total.toFixed(1)}B
        </p>
      </div>

      {/* Allocation Bars */}
      <div className="space-y-4 flex-1">
        {ALLOCATION_DATA.map((item) => (
          <div key={item.ministry}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/70">{item.ministry}</span>
              <span className="text-xs text-white/50">{item.percentage}%</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                viewport={{ once: true }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-white/[0.07]">
        <p className="text-xs text-white/40 text-center">
          Updated every 4 seconds
        </p>
      </div>
    </motion.div>
  )
}