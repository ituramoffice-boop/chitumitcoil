import { supabase } from "@/integrations/supabase/client";

export const STRIPE_TIERS = {
  starter: {
    name: "Starter",
    nameHe: "סטארטר",
    product_id: "prod_UDO4n2dpIZmWAJ",
    price_id: "price_1TExHuGkBtnMlOwM1VhjiXJf",
    price: 0,
  },
  professional: {
    name: "Professional",
    nameHe: "מקצועי",
    product_id: "prod_UDO4lR601rDrEx",
    price_id: "price_1TExIgGkBtnMlOwMWJlkef47",
    price: 370,
  },
  enterprise: {
    name: "Enterprise",
    nameHe: "אנטרפרייז",
    product_id: "prod_UDO5EgJvqostoe",
    price_id: "price_1TExJ0GkBtnMlOwMmCYJxBb9",
    price: 990,
  },
} as const;

export type StripeTierKey = keyof typeof STRIPE_TIERS;

export function getTierByProductId(productId: string): StripeTierKey | null {
  for (const [key, tier] of Object.entries(STRIPE_TIERS)) {
    if (tier.product_id === productId) return key as StripeTierKey;
  }
  return null;
}

export async function createCheckoutSession(priceId: string) {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId },
  });
  if (error) throw error;
  return data as { url: string };
}

export async function checkSubscription(accessToken?: string) {
  const { data, error } = await supabase.functions.invoke("check-subscription", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (error) throw error;
  return data as {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  };
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) throw error;
  return data as { url: string };
}
