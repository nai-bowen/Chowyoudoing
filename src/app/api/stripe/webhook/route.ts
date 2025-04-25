/*eslint-disable*/

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/server/db";

type SubscriptionWithCurrentPeriodEnd = Stripe.Subscription & {
  current_period_end: number;
};

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});


// This is your Stripe webhook secret for verifying the events are sent by Stripe
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Make sure this is a subscription event
        if (session.mode !== "subscription") break;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId;
        if (!userId) break;
        
        // Update user premium status in database
        await handleSuccessfulSubscription(userId, session.subscription as string);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the restaurateur with this subscription
        const restaurateur = await db.restaurateur.findFirst({
          where: {
            stripeSubscriptionId: subscription.id
          }
        });
        
        if (!restaurateur) break;
        
        // Update the subscription status
        await updateSubscriptionStatus(restaurateur.id, subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the restaurateur with this subscription
        const restaurateur = await db.restaurateur.findFirst({
          where: {
            stripeSubscriptionId: subscription.id
          }
        });
        
        if (!restaurateur) break;
        
        // Cancel the subscription
        await cancelSubscription(restaurateur.id);
        break;
      }
      // Add other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Helper function to handle successful subscription
async function handleSuccessfulSubscription(userId: string, subscriptionId: string): Promise<void> {
  try {
    // Retrieve the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    
    // Get subscription end date
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    // Update the restaurateur in the database
    await db.restaurateur.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumSince: new Date(),
        premiumExpiresAt: currentPeriodEnd,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
      }
    });
    
    console.log(`Successfully updated premium status for user ${userId}`);
  } catch (error) {
    console.error(`Failed to handle subscription for user ${userId}:`, error);
    throw error;
  }
}

// Helper function to update subscription status
async function updateSubscriptionStatus(userId: string, subscription: Stripe.Subscription): Promise<void> {
  try {
    const patchedSubscription = subscription as SubscriptionWithCurrentPeriodEnd;

    const currentPeriodEnd = new Date(patchedSubscription.current_period_end * 1000);
    const status = patchedSubscription.status;
    
    await db.restaurateur.update({
      where: { id: userId },
      data: {
        isPremium: status === "active" || status === "trialing",
        premiumExpiresAt: currentPeriodEnd,
      }
    });
    
    console.log(`Updated subscription status for user ${userId} to ${status}`);
  } catch (error) {
    console.error(`Failed to update subscription status for user ${userId}:`, error);
    throw error;
  }
}

// Helper function to cancel subscription
async function cancelSubscription(userId: string): Promise<void> {
  try {
    await db.restaurateur.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumExpiresAt: new Date(), // Set to current date to expire immediately
      }
    });
    
    console.log(`Cancelled subscription for user ${userId}`);
  } catch (error) {
    console.error(`Failed to cancel subscription for user ${userId}:`, error);
    throw error;
  }
}

// Configure header handling for the API route
export const config = {
  api: {
    bodyParser: false,
  },
};