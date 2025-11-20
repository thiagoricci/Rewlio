import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("Webhook secret not configured");
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Webhook signature verification failed:", errorMessage);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook event received:", event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout session completed:", session.id);

      const userId = session.metadata?.user_id;
      if (!userId) {
        console.error("No user_id in session metadata");
        throw new Error("User ID not found in session metadata");
      }

      // Get the line items to determine credits purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      if (!priceId) {
        throw new Error("Price ID not found in line items");
      }

      // Look up the product to get credit amount
      const { data: product, error: productError } = await supabase
        .from("stripe_products")
        .select("credits, name")
        .eq("stripe_price_id", priceId)
        .single();

      if (productError || !product) {
        console.error("Error finding product:", productError);
        throw new Error("Product not found for price ID: " + priceId);
      }

      console.log(`Adding ${product.credits} credits for user ${userId}`);

      // Get current credits
      const { data: currentCredits, error: fetchError } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching current credits:", fetchError);
        throw new Error("Failed to fetch current credits");
      }

      // Update credits
      const newCredits = currentCredits.credits + product.credits;
      const { error: updateError } = await supabase
        .from("user_credits")
        .update({ credits: newCredits })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        throw new Error("Failed to update credits");
      }

      // Log transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: product.credits,
          type: "purchase",
          description: `Purchased ${product.name}`,
          stripe_session_id: session.id,
        });

      if (transactionError) {
        console.error("Error logging transaction:", transactionError);
      }

      console.log(`Successfully added ${product.credits} credits. New balance: ${newCredits}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
