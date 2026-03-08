'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Bus, User2, Loader2, Upload, Camera, MapPin,
  Shield, Phone, Mail, CreditCard, CheckCircle2,
  ArrowRight, HeartPulse, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getFirebaseApp } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firebaseDb';
import { VEHICLE_TYPES, DEFAULT_LOCATION } from '@/lib/constants';
import { VehicleTypeId, checkProfileCompletion } from '@/lib/types';
import { getDatabase, ref, set as rtdbSet } from 'firebase/database';
import { YatraOnboardingWizard } from '@/components/onboarding/YatraOnboardingWizard';

// Form Schemas
const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  vehicleType: z.enum(['bus', 'others', 'taxi', 'bike']),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  route: z.string().min(1, 'Route is required'),
  capacity: z.number().min(1).max(100),
  profileImage: z.string().optional(),
  vehicleImage: z.string().optional(),
});

const passengerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  emergencyContact: z.string().min(10, 'Contact must be at least 10 digits'),
  solanaWallet: z.string().optional().or(z.literal('')),
});

type DriverFormData = z.infer<typeof driverSchema>;
type PassengerFormData = z.infer<typeof passengerSchema>;

// Image Resizer Helper
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.onerror = reject;
  });
};

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, role, userData, loading, setRole } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const roleFromUrl = searchParams.get('role') as 'driver' | 'passenger' | null;
  const effectiveRole = roleFromUrl || role;

  useEffect(() => {
    if (currentUser && !role && roleFromUrl) {
      setRole(roleFromUrl);
    }
  }, [currentUser, role, roleFromUrl, setRole]);

  useEffect(() => {
    if (!loading && currentUser && userData && !isSubmitting) {
      if (checkProfileCompletion(userData)) {
        window.location.assign(userData.role === 'driver' ? '/driver' : '/passenger');
      }
    }
  }, [currentUser, userData, loading, isSubmitting]);

  const driverForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: { name: '', vehicleType: 'bus', vehicleNumber: '', licenseNumber: '', route: '', capacity: 40 },
  });

  const passengerForm = useForm<PassengerFormData>({
    resolver: zodResolver(passengerSchema),
    defaultValues: { name: '', email: currentUser?.email || '', emergencyContact: '', solanaWallet: '' },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'vehicleImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      driverForm.setValue(field, resized);
      field === 'profileImage' ? setProfilePreview(resized) : setVehiclePreview(resized);
    }
  };

  const handleDriverSubmit = async (data: DriverFormData) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await currentUser.getIdToken(true);
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'driver', userData: data }),
      });

      await createUserProfile(currentUser.uid, { ...data, phone: currentUser.phoneNumber || '', role: 'driver', isApproved: false });

      const rtdb = getDatabase(getFirebaseApp());
      await rtdbSet(ref(rtdb, `buses/${currentUser.uid}`), {
        id: currentUser.uid, driverName: data.name, busNumber: data.vehicleNumber, route: data.route,
        capacity: data.capacity, isActive: false, availableSeats: data.capacity,
        currentLocation: { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng, timestamp: new Date().toISOString() }
      });

      toast({ title: 'Profile Created', description: 'Welcome to the Yatra Driver Fleet.' });
      window.location.assign('/driver');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save driver profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassengerSubmit = async (data: PassengerFormData) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await currentUser.getIdToken(true);
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'passenger', userData: data }),
      });

      await createUserProfile(currentUser.uid, { ...data, phone: currentUser.phoneNumber || '', role: 'passenger' });
      toast({ title: 'Profile Created', description: 'You are ready to ride!' });
      window.location.assign('/passenger');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser || (effectiveRole !== 'driver' && effectiveRole !== 'passenger')) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Progress Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            {effectiveRole === 'driver' ? <Bus className="w-8 h-8 text-emerald-400" /> : <User2 className="w-8 h-8 text-emerald-400" />}
          </div>
          <h1 className="text-3xl font-black tracking-tight">Complete Your Profile</h1>
          <p className="text-slate-400">Step {currentStep} of 2: {currentStep === 1 ? 'Verification' : 'Details'}</p>
        </div>

        {currentStep === 1 ? (
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md p-8 text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold">Identity Verified</h2>
            <p className="text-slate-400">Your account is secured. Now let's customize your {effectiveRole} experience.</p>
            <Button onClick={() => setCurrentStep(2)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        ) : (
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md p-6 md:p-10">
            {effectiveRole === 'driver' ? (
              <form onSubmit={driverForm.handleSubmit(handleDriverSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input {...driverForm.register('name')} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select onValueChange={(v) => driverForm.setValue('vehicleType', v as any)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {VEHICLE_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Number</Label>
                    <Input {...driverForm.register('vehicleNumber')} placeholder="BA 1 PA 1234" className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input {...driverForm.register('licenseNumber')} className="bg-slate-800 border-slate-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Route</Label>
                  <Input {...driverForm.register('route')} placeholder="e.g. Butwal to Bhairahawa" className="bg-slate-800 border-slate-700" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Register as Driver'}
                </Button>
              </form>
            ) : (
              <form onSubmit={passengerForm.handleSubmit(handlePassengerSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input {...passengerForm.register('name')} className="bg-slate-800 border-slate-700 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact Number</Label>
                    <div className="relative">
                      <HeartPulse className="absolute left-3 top-3.5 w-5 h-5 text-red-500" />
                      <Input {...passengerForm.register('emergencyContact')} placeholder="98XXXXXXXX" className="pl-10 bg-slate-800 border-slate-700 h-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Solana Wallet (Optional)</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-3.5 w-5 h-5 text-emerald-500" />
                      <Input {...passengerForm.register('solanaWallet')} placeholder="Wallet Address" className="pl-10 bg-slate-800 border-slate-700 h-12" />
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Setup'}
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}