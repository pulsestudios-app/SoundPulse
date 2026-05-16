import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/src/lib/supabase";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        // Stale or invalid stored auth data can cause repeated refresh errors.
        await supabase.auth.signOut({ scope: "local" });
      }

      if (isMounted) {
        setSession(error ? null : (data.session ?? null));
        setIsLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
