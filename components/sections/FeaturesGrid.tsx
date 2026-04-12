// name=components/sections/FeaturesGrid.tsx
'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from './ScrollReveal'

const FEATURES = [
  {
    icon: '🔐',
    title: 'Immutable Records',
    description: 'Every transaction permanently recorded on Solana blockchain, tamper-proof and auditable.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Settlement',
    description: 'Transactions finalize within seconds. No reconciliation delays or hidden transfers.',
  },
  {
    icon: '📊',
    title: 'Public Auditability',
    description: 'Citizens can verify any transaction. Complete transparency in government spending.',
  },
  {
    icon: '🌐',
    title: 'Decentralized Protocol',
    description: 'No central point of failure. Protocol maintained by distributed network validators.',
  },
  {
    icon: '💰',
    title: 'Cost-Efficient',
    description: 'Sub-cent transaction costs. Savings redirected to actual public services.',
  },
  {
    icon: '🛡️',
    title: 'Military-Grade Security',
    description: 'Ed25519 cryptography. Signature verification required for all transactions.',
  },
]

export function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, i) => (
        <ScrollReveal key={feature.title} delay={i * 0.1}>
          <motion.div
            className="glass-card p-6 hover:border-[#00C2FF]/50 transition-colors group"
            whileHover={{ y: -4 }}
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        </ScrollReveal>
      ))}
    </div>
  )
}