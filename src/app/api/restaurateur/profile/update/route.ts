/*eslint-disable*/
/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get request body
    const body = await req.json();
    const { 
      restaurantName,
      businessRegNumber,
      vatNumber,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail
    } = body;

    // Validate required fields
    if (!restaurantName?.trim()) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    if (!contactPersonName?.trim()) {
      return NextResponse.json({ error: "Contact person name is required" }, { status: 400 });
    }

    if (!contactPersonEmail?.trim()) {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 });
    } else if (!/^\S+@\S+\.\S+$/.test(contactPersonEmail)) {
      return NextResponse.json({ error: "Invalid contact email format" }, { status: 400 });
    }

    if (!contactPersonPhone?.trim()) {
      return NextResponse.json({ error: "Contact phone is required" }, { status: 400 });
    }

    if (!addressLine1?.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    if (!city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    if (!postalCode?.trim()) {
      return NextResponse.json({ error: "Postal code is required" }, { status: 400 });
    }

    if (!country?.trim()) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 });
    }

    // Find the restaurateur by email from session
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found in session" }, { status: 400 });
    }

    // First, try to find the restaurateur directly by email
    let restaurateur = await db.restaurateur.findFirst({
      where: { 
        OR: [
          { email: userEmail },
          { contactPersonEmail: userEmail }
        ]
      }
    });

    // If not found directly, check for restaurateur accounts
    if (!restaurateur) {
      const account = await db.restaurateurAccount.findFirst({
        where: { email: userEmail },
        include: { restaurateur: true }
      });

      if (!account || !account.restaurateur) {
        return NextResponse.json({ error: "Restaurateur profile not found" }, { status: 404 });
      }

      restaurateur = account.restaurateur;
    }

    // Check if verification status was rejected, if so set it back to pending
    const wasRejected = restaurateur.verificationStatus === "REJECTED";
    
    // Update the restaurateur profile
    const updatedRestaurateur = await db.restaurateur.update({
      where: { id: restaurateur.id },
      data: {
        restaurantName: restaurantName.trim(),
        businessRegNumber: businessRegNumber?.trim() || null,
        vatNumber: vatNumber?.trim() || null,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim() || null,
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        contactPersonName: contactPersonName.trim(),
        contactPersonPhone: contactPersonPhone.trim(),
        contactPersonEmail: contactPersonEmail.trim(),
        // If previously rejected, set back to pending
        ...(wasRejected && { verificationStatus: "PENDING", submittedAt: new Date() })
      }
    });

    // Update related restaurateur account if it exists
    if (restaurateur.email !== contactPersonEmail) {
      await db.restaurateurAccount.updateMany({
        where: { restaurateurId: restaurateur.id },
        data: { email: contactPersonEmail }
      });
    }

    return NextResponse.json(updatedRestaurateur);
  } catch (error) {
    console.error("Error updating restaurateur profile:", error);
    return NextResponse.json(
      { error: "Failed to update restaurateur profile" }, 
      { status: 500 }
    );
  }
}