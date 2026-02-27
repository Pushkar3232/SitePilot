// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Spinner } from '@/components/atoms/Spinner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (data.session && data.session.user) {
          // User is authenticated, now check if they exist in our database
          try {
            const syncResponse = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({
                supabase_auth_id: data.session.user.id,
                email: data.session.user.email,
                full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name
              }),
            });

            if (syncResponse.ok) {
              // User exists in database, redirect to dashboard
              router.push('/dashboard');
              return;
            }

            if (syncResponse.status === 404) {
              // User not onboarded, auto-create tenant for OAuth users
              const errorData = await syncResponse.json().catch(() => ({}));
              if (errorData.error === 'USER_NOT_ONBOARDED') {
                // Auto-create tenant and user for OAuth users
                try {
                  const onboardResponse = await fetch('/api/tenants/onboard', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${data.session.access_token}`,
                    },
                    body: JSON.stringify({
                      auth_user_id: data.session.user.id,
                      email: data.session.user.email,
                      full_name: data.session.user.user_metadata?.full_name || 
                                data.session.user.user_metadata?.name || 
                                data.session.user.email?.split('@')[0],
                      tenant: {
                        name: data.session.user.user_metadata?.full_name || 
                              data.session.user.email?.split('@')[0] || 'My Organization',
                        plan_id: 'plan_starter' // Default to starter plan
                      }
                    }),
                  });

                  if (onboardResponse.ok) {
                    // Successfully created tenant and user, redirect to dashboard
                    router.push('/dashboard');
                    return;
                  } else {
                    throw new Error('Failed to create organization');
                  }
                } catch (onboardError) {
                  console.error('Auto-onboarding error:', onboardError);
                  setError('Failed to complete setup. Please try signing in again.');
                  setTimeout(() => router.push('/login'), 3000);
                  return;
                }
              }
            }

            // Other sync error, show generic error
            throw new Error('Failed to sync user data');

          } catch (syncError) {
            console.error('User sync error:', syncError);
            setError('Failed to complete authentication. Please try signing in again.');
            setTimeout(() => router.push('/login'), 3000);
            return;
          }
        } else {
          // No session, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setError('Something went wrong. Redirecting to login...');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
            {error}
          </div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto mb-4">
          <Spinner size="lg" />
        </div>
        <p className="text-sm text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}