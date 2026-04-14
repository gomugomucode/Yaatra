'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User2, Bus, Phone, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Role = 'driver' | 'passenger';

interface OnboardingData {
  role: Role;
  name: string;
  phone: string;
  licenseNumber?: string;
}

interface YatraOnboardingWizardProps {
  initialRole: Role;
  onComplete: (data: OnboardingData) => void;
}

const containerVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
};

const stepTransition = {
  duration: 0.45,
  ease: [0.22, 0.61, 0.36, 1] as const,
};

export function YatraOnboardingWizard({ initialRole, onComplete }: YatraOnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const isDriver = role === 'driver';

  const canGoNext =
    (step === 1 && !!role) ||
    (step === 2 && !!name.trim() && phone.replace(/\D/g, '').length >= 8) ||
    (step === 3 && (!isDriver || !!licenseNumber.trim()));

  const handleNext = () => {
    if (!canGoNext) return;
    if (step === 3 || (!isDriver && step === 2)) {
      onComplete({
        role,
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        licenseNumber: isDriver ? licenseNumber.trim() : undefined,
      });
      return;
    }
    setStep((prev) => (prev === 1 ? 2 : 3));
  };

  const handleBack = () => {
    if (step === 1) return;
    if (step === 3 && !isDriver) {
      setStep(2);
      return;
    }
    setStep((prev) => (prev === 3 ? 2 : 1));
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-24 right-0 w-72 h-72 bg-cyan-500/25 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 left-0 w-72 h-72 bg-emerald-500/25 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-slate-900/60 px-4 py-1.5 shadow-[0_0_0_1px_rgba(8,47,73,0.4)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-cyan-300 uppercase">
            Yatra Onboarding
          </span>
        </div>
        <h2 className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-400 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
          Tailored transit in three breaths
        </h2>
        <p className="max-w-md text-sm text-slate-300/80">
          Choose your role, set your identity, and (for drivers) lock your license into a secure zk vault.
        </p>

        {/* Progress indicator */}
        <div className="mt-3 flex items-center gap-3 text-xs font-medium text-slate-400">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition-all ${
                  step === s
                    ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                    : s < step
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s !== 3 && (
                <div
                  className={`h-px w-6 rounded-full ${
                    step > s ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 shadow-[0_22px_80px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.16),transparent_55%),radial-gradient(circle_at_bottom,_rgba(52,211,153,0.12),transparent_55%)] pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={stepTransition}
                className="space-y-6"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">
                  Step 1 · Choose your cockpit
                </p>
                <h3 className="text-xl font-semibold text-white mb-2">Who are you riding as today?</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Driver card */}
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                      role === 'driver'
                        ? 'border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                        : 'border-slate-700/70 bg-slate-900/70 hover:border-emerald-400/50 hover:bg-slate-900'
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-60 group-hover:opacity-100">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl" />
                      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-500/15 blur-2xl" />
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/40">
                        <Bus className="h-7 w-7 text-white" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Driver Cockpit</p>
                        <p className="text-xs text-slate-300/90">
                          Live fleet controls, accident SOS, cryptographic trip receipts.
                        </p>
                      </div>
                    </div>

                    {role === 'driver' && (
                      <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                        Selected
                      </div>
                    )}
                  </button>

                  {/* Passenger card */}
                  <button
                    type="button"
                    onClick={() => setRole('passenger')}
                    className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                      role === 'passenger'
                        ? 'border-cyan-400/70 bg-cyan-500/10 shadow-[0_0_25px_rgba(34,211,238,0.35)]'
                        : 'border-slate-700/70 bg-slate-900/70 hover:border-cyan-400/50 hover:bg-slate-900'
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-60 group-hover:opacity-100">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-2xl" />
                      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-sky-500/15 blur-2xl" />
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 shadow-lg shadow-cyan-500/40">
                        <User2 className="h-7 w-7 text-white" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Passenger Mode</p>
                        <p className="text-xs text-slate-300/90">
                          Hail nearby buses, see live ETAs, mint soulbound trip tickets.
                        </p>
                      </div>
                    </div>

                    {role === 'passenger' && (
                      <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-cyan-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                        Selected
                      </div>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={stepTransition}
                className="space-y-6"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">
                  Step 2 · Identity & contact
                </p>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Let&apos;s put a name to this cockpit.
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  {/* Name field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=" "
                        className="peer h-14 rounded-2xl border border-slate-700/80 bg-slate-900/70 px-11 text-sm text-white shadow-inner shadow-slate-900/60 placeholder-transparent outline-none transition-all focus:border-cyan-400/70 focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                      />
                      <User2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 peer-focus:text-cyan-300" />
                      <label
                        className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/80 px-2 text-[11px] text-slate-400 transition-all
                        peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500
                        peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-cyan-300"
                      >
                        Full name
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      This is how we greet you on live tickets and alerts.
                    </p>
                  </div>

                  {/* Phone field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-slate-400">
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-200">
                          +977
                        </span>
                      </span>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder=" "
                        inputMode="tel"
                        className="peer h-14 rounded-2xl border border-slate-700/80 bg-slate-900/70 pl-24 pr-4 text-sm text-white shadow-inner shadow-slate-900/60 placeholder-transparent outline-none transition-all focus:border-emerald-400/70 focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <Phone className="pointer-events-none absolute left-[4.9rem] top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 peer-focus:text-emerald-300" />
                      <label
                        className="pointer-events-none absolute left-[5.8rem] top-1/2 -translate-y-1/2 rounded-full bg-slate-950/80 px-2 text-[11px] text-slate-400 transition-all
                        peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500
                        peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-emerald-300"
                      >
                        Phone number
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Used for trip notifications and secure OTP sign-in.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && isDriver && (
              <motion.div
                key="step-3-driver"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={stepTransition}
                className="space-y-6"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">
                  Step 3 · Secure license vault
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Seal your license into Yatra&apos;s zk vault.
                </h3>

                <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-stretch">
                  {/* License input */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder=" "
                        className="peer h-14 rounded-2xl border border-emerald-500/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-11 text-sm text-white shadow-[0_0_0_1px_rgba(16,185,129,0.5)] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                      />
                      <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                      <label
                        className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/90 px-2 text-[11px] text-emerald-200 transition-all
                        peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-emerald-200/80
                        peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-emerald-300"
                      >
                        License number (vaulted)
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-200/80">
                      Encrypted at rest. Verifiable with zero-knowledge proofs for compliance checks.
                    </p>
                  </div>

                  {/* zk-proof animation */}
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/10 p-4 shadow-[0_18px_45px_rgba(16,185,129,0.35)]">
                    <div className="pointer-events-none absolute inset-0">
                      <motion.div
                        className="absolute -left-10 top-1/2 h-32 w-32 rounded-full bg-emerald-400/25 blur-2xl"
                        animate={{ x: ['0%', '60%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        <Sparkles className="h-4 w-4 text-emerald-300" />
                        zk-Proof Engine
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-emerald-100/90">
                          <span>Constraint circuits</span>
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                          >
                            4·096 gates
                          </motion.span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-emerald-900/60">
                          <motion.div
                            className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
                            animate={{ x: ['-50%', '120%'] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[10px] text-emerald-100/80">
                          <div className="rounded-lg bg-emerald-500/10 px-2 py-1">License hash</div>
                          <div className="rounded-lg bg-emerald-500/10 px-2 py-1">Proof key</div>
                          <div className="rounded-lg bg-emerald-500/10 px-2 py-1">On-chain ready</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && !isDriver && (
              <motion.div
                key="step-3-passenger"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={stepTransition}
                className="space-y-6"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">
                  Step 3 · Ready to ride
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">
                  You&apos;re all set, {name || 'traveler'}.
                </h3>
                <p className="max-w-md text-sm text-slate-300/90">
                  We&apos;ll use your name and number to keep you synced with live buses, boarding alerts, and
                  soulbound ticket receipts.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer controls */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 1}
              onClick={handleBack}
              className="h-10 rounded-full border border-slate-700/80 bg-slate-900/70 px-4 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="h-11 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-sky-500 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_15px_40px_rgba(6,182,212,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:shadow-none"
            >
              {step === 3 || (!isDriver && step === 2) ? 'Finish onboarding' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

