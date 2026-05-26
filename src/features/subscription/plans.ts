export type SubscriptionPlanId = "basic" | "pro" | "unlimited";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  badge: "Most Popular" | "Best Value" | null;
  glow: boolean;
  generationLimit: number;
  features: string[];
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    badge: null,
    glow: false,
    generationLimit: 10,
    features: [
      "10 AI generations/month",
      "4 layer mixer layers",
      "Background playback",
      "Share to community",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    glow: true,
    generationLimit: 30,
    features: [
      "30 AI generations/month",
      "Unlimited layers",
      "Everything in Basic",
      "Save community sounds",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    badge: "Best Value",
    glow: true,
    generationLimit: 50,
    features: [
      "50 AI generations/month",
      "Everything in Pro",
      "Priority generation",
    ],
  },
];
