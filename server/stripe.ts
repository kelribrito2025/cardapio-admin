/**
 * Stripe Integration - Recarga de Saldo SMS
 * 
 * Gerencia checkout sessions para recarga de créditos SMS via cartão de crédito.
 */

import Stripe from "stripe";
import { ENV } from "./_core/env";

// Inicializar Stripe
function getStripe(): Stripe | null {
  if (!ENV.stripeSecretKey) {
    console.warn("[Stripe] STRIPE_SECRET_KEY não configurada");
    return null;
  }
  return new Stripe(ENV.stripeSecretKey);
}

// Custo por SMS em reais
export const COST_PER_SMS = 0.097;

// Pacotes de recarga SMS disponíveis
export const SMS_PACKAGES = [
  {
    id: "sms_100",
    name: "100 SMS",
    smsCount: 100,
    priceInCents: 970, // R$ 9,70 (100 x R$ 0,097)
    priceFormatted: "R$ 9,70",
    description: "Pacote com 100 créditos SMS",
  },
  {
    id: "sms_250",
    name: "250 SMS",
    smsCount: 250,
    priceInCents: 2425, // R$ 24,25 (250 x R$ 0,097)
    priceFormatted: "R$ 24,25",
    description: "Pacote com 250 créditos SMS",
  },
  {
    id: "sms_500",
    name: "500 SMS",
    smsCount: 500,
    priceInCents: 4850, // R$ 48,50 (500 x R$ 0,097)
    priceFormatted: "R$ 48,50",
    description: "Pacote com 500 créditos SMS",
    popular: true,
  },
];

/**
 * Cria uma sessão de checkout Stripe para recarga de SMS com valor personalizado
 */
export async function createCustomSmsCheckoutSession(params: {
  amountInCents: number;
  smsCount: number;
  userId: number;
  userEmail: string;
  userName: string;
  establishmentId: number;
  origin: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  if (params.amountInCents < 100) throw new Error("Valor mínimo de recarga: R$ 1,00");
  if (params.amountInCents > 100000) throw new Error("Valor máximo de recarga: R$ 1.000,00");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: params.userId.toString(),
    customer_email: params.userEmail,
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `${params.smsCount} SMS`,
            description: `Recarga personalizada de ${params.smsCount} créditos SMS`,
          },
          unit_amount: params.amountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: params.userId.toString(),
      establishment_id: params.establishmentId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      package_id: "custom",
      sms_count: params.smsCount.toString(),
      type: "sms_recharge",
    },
    success_url: `${params.origin}/campanhas?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/campanhas?payment=cancelled`,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Cria uma sessão de checkout Stripe para recarga de SMS (pacote pré-definido)
 */
export async function createSmsCheckoutSession(params: {
  packageId: string;
  userId: number;
  userEmail: string;
  userName: string;
  establishmentId: number;
  origin: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const pkg = SMS_PACKAGES.find((p) => p.id === params.packageId);
  if (!pkg) throw new Error("Pacote de SMS não encontrado");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: params.userId.toString(),
    customer_email: params.userEmail,
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: pkg.name,
            description: pkg.description,
          },
          unit_amount: pkg.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: params.userId.toString(),
      establishment_id: params.establishmentId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      package_id: pkg.id,
      sms_count: pkg.smsCount.toString(),
      type: "sms_recharge",
    },
    success_url: `${params.origin}/campanhas?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/campanhas?payment=cancelled`,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

// Planos disponíveis para upgrade
export const PLAN_PACKAGES = [
  {
    id: "basic",
    name: "Plano Essencial",
    priceInCents: 7990, // R$ 79,90/mês
    description: "Transações ilimitadas, até 5 estabelecimentos, suporte por e-mail",
  },
  {
    id: "pro",
    name: "Plano Pro",
    priceInCents: 5900, // R$ 59,00/mês
    description: "Tudo do Essencial + estabelecimentos ilimitados, análises avançadas, assistente de IA",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Plano Enterprise",
    priceInCents: 9900, // R$ 99,00/mês
    description: "Tudo do Pro + suporte prioritário, API dedicada, personalizações",
  },
];

/**
 * Cria uma sessão de checkout Stripe para assinatura de plano (subscription recorrente)
 */
export async function createPlanCheckoutSession(params: {
  planId: string;
  userId: number;
  userEmail: string;
  userName: string;
  establishmentId: number;
  origin: string;
  isAnnual?: boolean;
  stripeCustomerId?: string | null;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const plan = PLAN_PACKAGES.find((p) => p.id === params.planId);
  if (!plan) throw new Error("Plano não encontrado");

  // Preço mensal ou anual (anual = 10 meses, desconto de 2 meses)
  const unitAmount = params.isAnnual 
    ? Math.round(plan.priceInCents * 10) // Anual: 10x o mensal
    : plan.priceInCents;
  const interval: 'month' | 'year' = params.isAnnual ? 'year' : 'month';
  const periodLabel = params.isAnnual ? " (Anual)" : " (Mensal)";

  // Configurar customer - reutilizar existente ou criar via customer_email
  const customerConfig: any = {};
  if (params.stripeCustomerId) {
    customerConfig.customer = params.stripeCustomerId;
  } else {
    customerConfig.customer_email = params.userEmail;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    ...customerConfig,
    client_reference_id: params.userId.toString(),
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: plan.name + periodLabel,
            description: plan.description,
          },
          unit_amount: unitAmount,
          recurring: {
            interval,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        user_id: params.userId.toString(),
        establishment_id: params.establishmentId.toString(),
        plan_id: plan.id,
        plan_type: plan.id,
        billing_period: params.isAnnual ? "annual" : "monthly",
      },
    },
    metadata: {
      user_id: params.userId.toString(),
      establishment_id: params.establishmentId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      plan_id: plan.id,
      plan_type: plan.id,
      is_annual: params.isAnnual ? "true" : "false",
      billing_period: params.isAnnual ? "annual" : "monthly",
      type: "plan_upgrade",
    },
    success_url: `${params.origin}/planos?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/planos?payment=cancelled`,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Cancela uma assinatura no Stripe (ao final do período atual)
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return true;
  } catch (err) {
    console.error("[Stripe] Erro ao cancelar subscription:", err);
    return false;
  }
}

/**
 * Busca detalhes de uma subscription no Stripe
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    console.error("[Stripe] Erro ao buscar subscription:", err);
    return null;
  }
}

/**
 * Verifica a assinatura do webhook e retorna o evento
 */
export function constructWebhookEvent(
  body: Buffer,
  signature: string
): Stripe.Event | null {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    console.error("[Stripe Webhook] Erro na verificação da assinatura:", err);
    return null;
  }
}

/**
 * Extrai metadados do checkout session completado
 */
export function extractCheckoutMetadata(session: Stripe.Checkout.Session) {
  return {
    userId: parseInt(session.metadata?.user_id || "0"),
    establishmentId: parseInt(session.metadata?.establishment_id || "0"),
    packageId: session.metadata?.package_id || "",
    smsCount: parseInt(session.metadata?.sms_count || "0"),
    type: session.metadata?.type || "",
    paymentIntentId: typeof session.payment_intent === "string" 
      ? session.payment_intent 
      : session.payment_intent?.id || "",
    amountTotal: session.amount_total || 0,
  };
}


// ============ CRÉDITOS DE MELHORIA DE IMAGEM COM IA ============

// Pacotes de créditos de imagem IA disponíveis
export const AI_IMAGE_PACKAGES = [
  {
    id: "ai_50",
    name: "50 melhorias",
    credits: 50,
    priceInCents: 4990, // R$ 49,90
    priceFormatted: "R$ 49,90",
    pricePerImage: "R$ 1,00",
    description: "Pacote com 50 melhorias de foto com IA",
  },
  {
    id: "ai_100",
    name: "100 melhorias",
    credits: 100,
    priceInCents: 6990, // R$ 69,90
    priceFormatted: "R$ 69,90",
    pricePerImage: "R$ 0,70",
    description: "Pacote com 100 melhorias de foto com IA",
    popular: true,
  },
  {
    id: "ai_300",
    name: "300 melhorias",
    credits: 300,
    priceInCents: 19790, // R$ 197,90
    priceFormatted: "R$ 197,90",
    pricePerImage: "R$ 0,66",
    description: "Pacote com 300 melhorias de foto com IA",
  },
];

/**
 * Cria uma sessão de checkout Stripe para compra de créditos de imagem IA
 */
export async function createAiImageCheckoutSession(params: {
  packageId: string;
  userId: number;
  userEmail: string;
  userName: string;
  establishmentId: number;
  origin: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const pkg = AI_IMAGE_PACKAGES.find((p) => p.id === params.packageId);
  if (!pkg) throw new Error("Pacote de créditos não encontrado");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: params.userId.toString(),
    customer_email: params.userEmail,
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `✨ ${pkg.name} de foto com IA`,
            description: pkg.description,
          },
          unit_amount: pkg.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: params.userId.toString(),
      establishment_id: params.establishmentId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      package_id: pkg.id,
      credits_count: pkg.credits.toString(),
      type: "ai_image_credits",
    },
    success_url: `${params.origin}/menu?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/menu?payment=cancelled`,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}
