export type SubscriptionPlanId = "basic" | "pro" | "unlimited";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  priceLabel: string;
  badge: "Most Popular" | "Best Value" | null;
  glow: boolean;
  features: string[];
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceLabel: "$9.99/mo",
    badge: null,
    glow: false,
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
    priceLabel: "$14.99/mo",
    badge: "Most Popular",
    glow: true,
    features: [
      "20 AI generations/month",
      "Unlimited layers",
      "Everything in Basic",
      "Save community sounds",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceLabel: "$19.99/mo",
    badge: "Best Value",
    glow: true,
    features: [
      "40 AI generations/month",
      "Everything in Pro",
      "Priority generation",
    ],
  },
];
