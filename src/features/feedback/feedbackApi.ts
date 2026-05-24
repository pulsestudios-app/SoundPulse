import { supabase } from "@/src/lib/supabase";

export type FeedbackType = "content" | "feature";

export async function submitFeedback(
  userId: string,
  type: FeedbackType,
  message: string
): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Please enter a description.");
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    type,
    message: trimmed,
  });

  if (error) {
    throw new Error(error.message);
  }
}
