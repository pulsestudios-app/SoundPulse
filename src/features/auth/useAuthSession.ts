import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/src/lib/supabase";
import { syncAnalyticsUserProperties, trackEvent, trackOncePerUser } from "@/src/lib/analytics";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let lastUserId: string | null = null;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        // Stale or invalid stored auth data can cause repeated refresh errors.
        await supabase.auth.signOut({ scope: "local" });
      }

      if (isMounted) {
        const next = error ? null : (data.session ?? null);
        setSession(next);
        setIsLoading(false);
        lastUserId = next?.user?.id ?? null;
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null;
      if (!lastUserId && nextUserId) {
        void trackEvent("signed_in");
      } else if (lastUserId && !nextUserId) {
        void trackEvent("signed_out");
      }

      if (nextUserId) {
        const createdAtIso = (nextSession?.user as unknown as { created_at?: string | null })?.created_at ?? null;
        void syncAnalyticsUserProperties({
          userId: nextUserId,
          planTier: "free",
          trialActive: false,
          createdAtIso,
        });
        // Track trial_started/email_verified once when we can infer them from session.
        // (email_confirmed_at is available on the server; client has a boolean-ish field.)
        const emailConfirmedAt = (nextSession?.user as unknown as { email_confirmed_at?: string | null })
          ?.email_confirmed_at;
        if (emailConfirmedAt) {
          void trackOncePerUser(nextUserId, "email_verified", "email_verified");
        }
      }

      setSession(nextSession ?? null);
      setIsLoading(false);
      lastUserId = nextUserId;
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
