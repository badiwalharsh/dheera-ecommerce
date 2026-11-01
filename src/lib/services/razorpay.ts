import crypto from "crypto";

export interface CreateOrderParams {
  amount: number; // In paise (e.g. ₹2999 -> 299900)
  currency?: string;
  receipt: string; // Internal order identifier
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string; // Razorpay order id (e.g. order_OPs7...)
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  isSimulated: boolean;
}

export interface VerifySignatureParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret?: string;
}

/**
 * Razorpay Test Mode Server-Side Integration
 *
 * NOTE: Keys remain strictly server-side. Never expose RAZORPAY_KEY_SECRET to the client.
 */
export class RazorpayService {
  private static getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";
  }

  private static getKeySecret(): string {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: RAZORPAY_KEY_SECRET must be configured in production."
      );
    }
    return "placeholder_secret";
  }

  private static getWebhookSecret(): string {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: RAZORPAY_WEBHOOK_SECRET must be configured in production."
      );
    }
    return "placeholder_webhook_secret";
  }

  /**
   * Check if live or real test credentials are configured
   */
  public static isConfigured(): boolean {
    const key = this.getKeyId();
    const secret = this.getKeySecret();
    return (
      key.startsWith("rzp_test_") &&
      key !== "rzp_test_placeholder" &&
      secret !== "placeholder_secret" &&
      secret.length > 5
    );
  }

  /**
   * Creates a Razorpay order via REST API or safe test sandbox simulator
   */
  public static async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
    const { amount, currency = "INR", receipt, notes = {} } = params;

    // Strict validation
    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      throw new Error(`Invalid Razorpay order amount: ${amount} paise`);
    }

    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    // 1. If configured with real Razorpay test keys, call official Razorpay API
    if (this.isConfigured()) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount,
            currency,
            receipt,
            notes: {
              ...notes,
              brand: "DHEERA",
              environment: "test_mode",
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Razorpay API Error: ${errData.error?.description || response.statusText}`);
        }

        const data = await response.json();
        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          receipt: data.receipt,
          status: data.status,
          isSimulated: false,
        };
      } catch (err: any) {
        console.warn("Direct Razorpay API call failed, falling back to secure test simulator:", err.message);
      }
    }

    // 2. High-fidelity Simulated Test Mode for development/sandbox
    const simulatedOrderId = `order_test_${crypto.randomBytes(8).toString("hex")}`;
    return {
      id: simulatedOrderId,
      amount,
      currency,
      receipt,
      status: "created",
      isSimulated: true,
    };
  }

  /**
   * Authoritative HMAC SHA-256 Payment Signature Verification
   * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) === signature
   */
  public static verifyPaymentSignature(params: VerifySignatureParams): {
    isValid: boolean;
    reason?: string;
  } {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, secret } = params;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return { isValid: false, reason: "Missing required signature verification parameters." };
    }

    const secretToUse = secret || this.getKeySecret();

    // Compute expected signature
    const expectedSignature = crypto
      .createHmac("sha256", secretToUse)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    // Timing-safe equality check to protect against timing attacks
    const signatureBuffer = Buffer.from(razorpaySignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { isValid: false, reason: "Invalid signature length." };
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    return {
      isValid,
      reason: isValid ? undefined : "Cryptographic signature mismatch. Potential payment tampering detected.",
    };
  }

  /**
   * Generates a valid test signature for development testing
   */
  public static generateTestSignature(orderId: string, paymentId: string): string {
    const secret = this.getKeySecret();
    return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  }

  /**
   * Authoritative Webhook Signature Verification
   */
  public static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = this.getWebhookSecret();
    if (!signature || !webhookSecret) return false;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  }
}

