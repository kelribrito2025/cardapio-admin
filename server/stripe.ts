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
  {
    id: "sms_1000",
    name: "1000 SMS",
    smsCount: 1000,
    priceInCents: 9700, // R$ 97,00 (1000 x R$ 0,097)
    priceFormatted: "R$ 97,00",
    description: "Pacote com 1000 créditos SMS",
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
