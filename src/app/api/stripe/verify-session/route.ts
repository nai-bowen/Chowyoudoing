/*eslint-disable*/

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is a restaurateur
  if (!session || !session.user || session.user.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id parameter" }, 
      { status: 400 }
    );
  }

  try {
    // Retrieve the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify that this session belongs to the current user
    if (checkoutSession.customer_email !== session.user.email) {
      return NextResponse.json(
        { error: "Session does not match current user" }, 
        { status: 403 }
      );
    }
    
    // Check if the payment was successful
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { 
          error: "Payment not completed", 
          status: checkoutSession.payment_status 
        }, 
        { status: 400 }
      );
    }

    // Get subscription ID from the session
    const subscriptionId = checkoutSession.subscription as string;
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No subscription found in session" }, 
        { status: 400 }
      );
    }
    
    // Retrieve the subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

    // Check subscription status
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json(
        { 
          error: "Subscription is not active", 
          status: subscription.status 
        }, 
        { status: 400 }
      );
    }
    
    // Update the restaurateur in the database
    const userId = session.user.id;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
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
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd.toISOString()
      }
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json(
      { error: "Failed to verify session" }, 
      { status: 500 }
    );
  }
}