/*eslint-disable*/

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is a restaurateur
  if (!session || !session.user || session.user.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request body to get the plan type
    const { planType } = await req.json();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email!,
      line_items: [
        {
          price: "price_1RHrSHR89eR7ByogwLos4H7t",
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium-cancel`,
      metadata: {
        userId: session.user.id!,
      },
      payment_method_collection: "if_required", 
    });
    
    

    // Return the checkout URL
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Could not create checkout session" }, 
      { status: 500 }
    );
  }
}