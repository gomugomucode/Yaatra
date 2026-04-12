// name=lib/constants.ts
/**
 * Application-wide constants
 */

export const SOLANA_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID || '',
} as const

export const UI_CONSTANTS = {
  POLL_INTERVAL_MS: 4000,
  MAX_TABLE_ROWS: 14,
  ANIMATION_DURATION: 0.5,
  STAGGER_DELAY: 0.1,
} as const

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  FEED: '/feed',
  MINISTRIES: '/ministries',
  AUDIT: '/audit',
} as const

export const MINISTRY_COLORS: Record<string, string> = {
  Infrastructure: '#f59e0b',
  Health: '#34d399',
  Education: '#60a5fa',
  Defence: '#f87171',
  Agriculture: '#a3e635',
  Energy: '#e879f9',
} as const