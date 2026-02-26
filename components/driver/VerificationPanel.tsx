'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { Driver } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { updateDriverVerificationStatus } from '@/lib/firebaseDb';

interface VerificationPanelProps {
    driver: Driver;
    onVerificationSuccess: () => void;
}

export default function VerificationPanel({ driver, onVerificationSuccess }: VerificationPanelProps) {
    const { toast } = useToast();
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            // Require a Solana wallet address. For hackathon, we could prompt or assume one.
            // In a real app, they would connect Phantom. We'll simulate their phone/ID as the wallet temporarily if missing
            const simulatedWallet = driver.solanaWallet || '11111111111111111111111111111111';

            const response = await fetch('/api/solana/verify-driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: driver.id,
                    licenseNumber: driver.licenseNumber || 'PENDING_LICENSE',
                    driverName: driver.name,
                    vehicleType: driver.vehicleType,
                    driverWalletAddress: simulatedWallet
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Save to Firebase
            await updateDriverVerificationStatus(driver.id, {
                mintAddress: data.mintAddress,
                txSignature: data.signature,
                explorerLink: data.explorerLink,
                verifiedAt: new Date().toISOString()
            });

            toast({
                title: 'Blockchain Verification Complete! 🎉',
                description: 'Your soulbound Verification Badge has been minted on Solana.',
                duration: 5000,
            });

            onVerificationSuccess();

        } catch (error: any) {
            console.error('Verification error:', error);
            toast({
                title: 'Verification Failed',
                description: error.message || 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsVerifying(false);
        }
    };

    if (driver.verificationBadge) {
        return (
            <Card className="bg-emerald-950/20 border-emerald-500/30 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                Verified Driver
                            </CardTitle>
                            <CardDescription className="text-emerald-400/80">
                                Secured by Solana
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <p className="text-sm text-slate-300">
                            Your documents are cryptographically hashed and verified on-chain. Passengers trust verified drivers more.
                        </p>
                        <a
                            href={driver.verificationBadge.explorerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            View Token-2022 Badge on Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-slate-900/60 border-slate-700/50 shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-white">
                            Get Verified
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Build trust with passengers
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                    Mint a permanent Solana Verification Badge using your driver documents. This proves your identity to passengers and cannot be faked.
                </p>
                <Button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold"
                >
                    {isVerifying ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Minting on Chain...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4 mr-2" />
                            Verify on Blockchain
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
