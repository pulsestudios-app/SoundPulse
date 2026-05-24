import { sanitizeFeedbackMessage } from "@/src/lib/sanitize";
import { supabase } from "@/src/lib/supabase";

export type FeedbackType = "content" | "feature";

export async function submitFeedback(
  userId: string,
  type: FeedbackType,
  message: string
): Promise<void> {
  const sanitized = sanitizeFeedbackMessage(message);
  if (!sanitized) {
    throw new Error("Please enter a description.");
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    type,
    message: sanitized,
  });

  if (error) {
    throw new Error(error.message);
  }
}
