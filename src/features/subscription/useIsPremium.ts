import { useCallback, useEffect, useState } from "react";

import { useAuthSession } from "@/src/features/auth/useAuthSession";
import { supabase } from "@/src/lib/supabase";

import { isPremiumSubscription, type SubscriptionRow } from "./subscriptionUtils";

export function useIsPremium(): { isPremium: boolean; loading: boolean; refresh: () => Promise<void> } {
  const { session } = useAuthSession();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan,status,expires_at")
      .eq("user_id", userId)
      .order("expires_at", { ascending: false })
      .limit(1);

    if (error) {
      setIsPremium(false);
    } else {
      const row = ((data ?? [])[0] as SubscriptionRow | undefined) ?? null;
      setIsPremium(isPremiumSubscription(row));
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { isPremium, loading, refresh };
}
