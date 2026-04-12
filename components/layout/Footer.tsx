// name=components/layout/Footer.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const FOOTER_LINKS = [
  {
    title: 'Protocol',
    links: [
      { label: 'Architecture', href: '/docs/architecture' },
      { label: 'Whitepaper', href: '/docs/whitepaper' },
      { label: 'API Reference', href: '/docs/api' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
]

export function Footer() {
  return (
    <motion.footer
      className="relative z-20 border-t border-white/[0.06] bg-[rgba(5,5,5,0.8)] backdrop-blur-xl"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-[1200px] mx-auto px-8 py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-4 gap-12 mb-12">
          {/* Branding Section */}
          <div>
            <div className="mb-4">
              <span className="font-display text-lg font-bold tracking-[0.08em] text-[#00C2FF]">
                दृष्टि
              </span>
              <p className="text-sm text-white/40 mt-2">
                Nepal's fiscal transparency protocol
              </p>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Immutable on-chain government budget transactions for complete public accountability.
            </p>
          </div>

          {/* Link Groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.06em] text-white mb-4">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-white/40 hover:text-[#00C2FF] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] mb-8" />

        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Government of Nepal. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com" className="text-white/30 hover:text-[#00C2FF] transition-colors">
              𝕏
            </a>
            <a href="https://github.com" className="text-white/30 hover:text-[#00C2FF] transition-colors">
              GitHub
            </a>
            <a href="https://discord.com" className="text-white/30 hover:text-[#00C2FF] transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}