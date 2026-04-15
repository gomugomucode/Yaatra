'use client';

import Link from 'next/link';
import { BusFront, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    title: 'Live tracking',
    description: 'Follow buses across Nepal in real time with crisp route visibility.',
    icon: MapPin,
  },
  {
    title: 'Fast booking',
    description: 'Reserve seats instantly and board with confidence.',
    icon: Clock,
  },
  {
    title: 'Secure identity',
    description: 'Zero-knowledge proofs ensure rider trust without sacrificing privacy.',
    icon: ShieldCheck,
  },
];

export default function YatraHero({
  currentUser,
  onRoleSwitch,
}: {
  currentUser: boolean;
  onRoleSwitch: (role: 'driver' | 'passenger') => void;
}) {
  // 2. Add Mount State
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 3. Return a consistent skeleton or null during server-side pass
  if (!mounted) {
    return <div className="min-h-[80vh] bg-slate-950" />; 
  }
  return (
    <section className="relative overflow-hidden bg-slate-950/70">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.22),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.18),_transparent_20%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_0.9fr] items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-slate-950/70 px-4 py-2 text-sm font-semibold tracking-[0.24em] text-cyan-300 shadow-[0_0_30px_rgba(14,165,233,0.12)] backdrop-blur-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              NOW LIVE IN BUTWAL
              <span className="ml-3 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-blue-200">BETA</span>
            </div>

            <div className="space-y-6 max-w-3xl">
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-[-0.05em] text-white leading-tight">
                Transit reimagined for riders and drivers.
              </h1>
              <p className="text-lg leading-8 text-slate-300 sm:text-xl">
                Yatra brings real-time bus tracking, instant seat booking, and private identity verification into a polished web portal built for modern Nepali commutes.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {currentUser ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => onRoleSwitch('passenger')}
                    className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-5 text-lg font-semibold shadow-2xl shadow-cyan-500/30 transition-transform hover:-translate-y-0.5"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Passenger Hub
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => onRoleSwitch('driver')}
                    className="w-full sm:w-auto rounded-2xl border border-white/15 bg-white/5 px-8 py-5 text-lg font-semibold text-white shadow-inner shadow-white/5 hover:bg-white/10 transition-all"
                  >
                    <BusFront className="h-5 w-5 mr-2" />
                    Driver Console
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-5 text-lg font-semibold shadow-2xl shadow-cyan-500/30 hover:-translate-y-0.5 transition-transform"
                  >
                    <Link href="/auth?role=passenger&redirect=/passenger">
                      <span className="flex items-center justify-center gap-2">
                        <Users className="h-5 w-5" />
                        Ride Now
                      </span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto rounded-2xl border border-white/15 bg-white/5 px-8 py-5 text-lg font-semibold text-white shadow-inner shadow-white/5 hover:bg-white/10 transition-all"
                  >
                    <Link href="/auth?role=driver&redirect=/driver">
                      <span className="flex items-center justify-center gap-2">
                        <BusFront className="h-5 w-5" />
                        Drive with Yatra
                      </span>
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.6)]">
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
            <div className="rounded-[2rem] bg-slate-950/95 p-6 shadow-inner shadow-cyan-500/10">
              <div className="grid gap-5 p-4 sm:grid-cols-[1fr_0.8fr]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Network status</p>
                      <p className="mt-2 text-xl font-semibold text-white">All systems nominal</p>
                    </div>
                    <div className="rounded-3xl bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300">Live</div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Route coverage</span>
                      <span className="font-semibold text-white">Butwal region</span>
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-800">
                      <div className="h-3 rounded-full bg-cyan-400" style={{ width: '82%' }} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Driver readiness</span>
                      <span className="font-semibold text-white">92%</span>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-[1.75rem] bg-gradient-to-br from-cyan-500/10 to-slate-950/70 p-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_40%)]" />
                  <div className="relative space-y-4">
                    <div className="rounded-3xl bg-slate-950/90 p-4 shadow-inner shadow-cyan-500/10">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Live bus feed</span>
                        <span className="text-cyan-300">3 active</span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-3xl bg-slate-900/80 p-3 text-sm text-slate-300">Bus 105 · 14m to stop</div>
                        <div className="rounded-3xl bg-slate-900/80 p-3 text-sm text-slate-300">Bus 211 · 7m to stop</div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-4 text-sm text-slate-300">
                      <p className="font-semibold text-white">Secure boarding verified</p>
                      <p className="mt-2 text-slate-400">Passenger identity validated by ZK credentials before boarding.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
