'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BusFront, Users, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { subscribeToBuses } from '@/lib/firebaseDb';
import YatraHero from '@/components/YatraHero';

const CORE_FEATURES = [
    {
        title: 'Live bus tracking',
        description: 'See buses on the map in real time and know exactly when they will arrive.',
        icon: MapPin,
    },
    {
        title: 'Instant booking',
        description: 'Reserve your seat with one tap and get notified when your bus is close.',
        icon: Clock,
    },
    {
        title: 'Secure identities',
        description: 'Zero-knowledge verification keeps private data safe while letting you ride confidently.',
        icon: ShieldCheck,
    },
];

const EXPERIENCE_CARDS = [
    {
        title: 'Locate buses instantly',
        text: 'Real-time telemetry from active vehicles means no more guessing or waiting at the stop.',
    },
    {
        title: 'Book seats with confidence',
        text: 'Reserve your spot and reduce crowding using a smooth booking flow.',
    },
    {
        title: 'Verify riders privately',
        text: 'ZK proofs protect privacy while granting access to trusted passengers.',
    },
    {
        title: 'Driver-ready tools',
        text: 'Drivers can go online and broadcast route status in seconds.',
    },
];

const TRUST_CARDS = [
    {
        title: 'Driver-first tools',
        text: 'Go online, share routes, and manage seats with a clean dashboard.',
    },
    {
        title: 'Passenger trust',
        text: 'Know who you ride with through secure identity verification.',
    },
    {
        title: 'Local support',
        text: 'Built for Nepal’s transit patterns with responsive performance.',
    },
]; export default function Home() {
    const { currentUser, signOut } = useAuth();
    const [mounted, setMounted] = useState(false); // Changed from isClient for clarity
    const [onlineBuses, setOnlineBuses] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);

        type BusStatus = { isActive?: boolean; locationSharingEnabled?: boolean };
        const unsubscribe = subscribeToBuses((buses: BusStatus[]) => {
            const activeCount = buses.filter((bus) => bus.isActive || bus.locationSharingEnabled).length;
            setOnlineBuses(activeCount);
        });

        return () => unsubscribe();
    }, []);

    const handleRoleSwitch = async (role: 'driver' | 'passenger') => {
        if (currentUser) {
            await signOut();
            const targetRedirect = role === 'driver' ? '/driver' : '/passenger';
            window.location.href = `/auth?role=${role}&redirect=${targetRedirect}&switch_role=true`;
        }
    };

    // HYDRATION GUARD: 
    // We return a stable, empty background on the server.
    // This matches the YatraHero "skeleton" perfectly.
    if (!mounted) {
        return <div className="min-h-screen bg-slate-950" />;
    }

    return (
        <div className="premium-dark-web3 min-h-screen bg-slate-950 text-slate-100">
            {/* Since we are past the !mounted check, we know we are on the client.
          We can safely pass the real currentUser state now.
      */}
            <YatraHero
                currentUser={!!currentUser}
                onRoleSwitch={handleRoleSwitch}
            />

            <section className="bg-slate-900/95 py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300 shadow-[0_0_30px_rgba(14,165,233,0.14)]">
                            Built for Nepal, trusted by commuters
                        </span>
                        <h2 className="mt-8 text-4xl md:text-5xl font-black text-white tracking-tight">
                            A refined commuter experience with bold motion and elegant clarity.
                        </h2>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-400 leading-8">
                            Yatra blends powerful transit technology with clean visual hierarchy.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {CORE_FEATURES.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-[0_32px_120px_-60px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:-translate-y-2 hover:border-cyan-500/20">
                                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-400 leading-7">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-slate-950/80 py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-10 lg:grid-cols-[0.95fr_0.9fr] items-center">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Motion-led UX</p>
                            <h2 className="mt-6 text-4xl md:text-5xl font-black text-white tracking-tight">Move through transit flows with intuitive clarity.</h2>
                            <p className="mt-6 max-w-xl text-lg text-slate-400 leading-8">
                                Each screen feels light and responsive, with strong information hierarchy, bold labels, and subtle motion to guide users at every decision point.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {EXPERIENCE_CARDS.map((card) => (
                                <div key={card.title} className="rounded-[2rem] border border-white/10 bg-slate-900/85 p-7 transition-transform duration-300 hover:-translate-y-2 floating-chip">
                                    <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
                                    <p className="text-slate-400 leading-7">{card.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900/95 py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-[0.95fr_0.9fr] items-center">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Designed for every journey</p>
                            <h2 className="mt-6 text-4xl md:text-5xl font-black text-white tracking-tight">A safer, smarter commuter experience</h2>
                            <p className="mt-6 max-w-xl text-lg text-slate-400 leading-8">
                                Yatra blends live route updates, verified passenger onboarding, and easy driver tools into a single app built for Nepal’s busy cities.
                            </p>
                        </div>

                        <div className="grid gap-5">
                            {TRUST_CARDS.map((item) => (
                                <div key={item.title} className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.65)] glass-3d floating-chip">
                                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-slate-400 leading-7">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-10">
                        <span className="inline-flex items-center justify-center rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                            Ready to ride?
                        </span>
                        <h2 className="mt-6 text-4xl md:text-5xl font-black text-white tracking-tight">Start your next journey in minutes.</h2>
                        <p className="mt-4 text-lg text-slate-400 leading-8">
                            Join Yatra and experience transit built for modern Nepali cities: faster, safer, and more transparent.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        {/* Change isClient to mounted here */}
                        {mounted ? (
                            currentUser ? (
                                <>
                                    <Button
                                        size="lg"
                                        onClick={() => handleRoleSwitch('passenger')}
                                        className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-5 text-lg font-semibold shadow-2xl shadow-cyan-500/30 hover:scale-[1.01] transition-transform"
                                    >
                                        <Users className="h-5 w-5 mr-2" />
                                        Open Passenger App
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => handleRoleSwitch('driver')}
                                        className="w-full sm:w-auto rounded-2xl border-white/20 bg-white/5 px-8 py-5 text-lg font-semibold text-white hover:bg-white/10 transition-all"
                                    >
                                        <BusFront className="h-5 w-5 mr-2" />
                                        Open Driver Console
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-5 text-lg font-semibold shadow-2xl shadow-cyan-500/30 hover:scale-[1.01] transition-transform"
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
                                        className="w-full sm:w-auto rounded-2xl border-white/20 bg-white/5 px-8 py-5 text-lg font-semibold text-white hover:bg-white/10 transition-all"
                                    >
                                        <Link href="/auth?role=driver&redirect=/driver">
                                            <span className="flex items-center justify-center gap-2">
                                                <BusFront className="h-5 w-5" />
                                                Drive with Yatra
                                            </span>
                                        </Link>
                                    </Button>
                                </>
                            )
                        ) : (
                            /* This matches your loading state */
                            <div className="h-20 w-full" />
                        )}
                    </div>

                    <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                        <span>No credit card required</span>
                        <span>•</span>
                        <span>Browser-first experience</span>
                        <span>•</span>
                        <span>Optimized for riders and drivers</span>
                    </div>
                </div>
            </section>

            <footer className="bg-slate-950 border-t border-slate-800/70 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 md:flex-row items-center justify-between">
                        <div className="flex flex-col gap-2 text-sm text-slate-400">
                            <span>Yatra — real-time transit for Nepal.</span>
                            <span>Built with Solana, Firebase, and zero-knowledge identity.</span>
                        </div>
                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${onlineBuses && onlineBuses > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            {onlineBuses === null ? 'Loading live bus status...' : `${onlineBuses} buses online now`}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
