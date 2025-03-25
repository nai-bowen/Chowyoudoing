// src/app/api/auth/restaurant-register/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse form data
    const formData = await req.formData();
    
    // Extract text fields
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const restaurantName = formData.get("restaurantName") as string;
    const businessRegNumber = formData.get("businessRegNumber") as string || null;
    const vatNumber = formData.get("vatNumber") as string || null;
    const addressLine1 = formData.get("addressLine1") as string;
    const addressLine2 = formData.get("addressLine2") as string || null;
    const city = formData.get("city") as string;
    const postalCode = formData.get("postalCode") as string;
    const country = formData.get("country") as string;
    const contactPersonName = formData.get("contactPersonName") as string;
    const contactPersonPhone = formData.get("contactPersonPhone") as string;
    const contactPersonEmail = formData.get("contactPersonEmail") as string;
    
    // Extract file fields
    const utilityBill = formData.get("utilityBill") as File | null;
    const businessLicense = formData.get("businessLicense") as File | null;
    const foodHygieneCert = formData.get("foodHygieneCert") as File | null;
    const storefrontPhoto = formData.get("storefrontPhoto") as File | null;
    const receiptPhoto = formData.get("receiptPhoto") as File | null;
    
    // Validate required fields
    if (!email || !password || !restaurantName || !addressLine1 || !city || !postalCode || !country ||
        !contactPersonName || !contactPersonPhone || !contactPersonEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if at least one verification document is provided
    if (!utilityBill && !businessLicense && !foodHygieneCert && !storefrontPhoto && !receiptPhoto) {
      return NextResponse.json({ error: "At least one verification document is required" }, { status: 400 });
    }
    
    // Check if email already exists
    const existingRestaurateur = await db.restaurateur.findUnique({
      where: { email }
    });
    
    if (existingRestaurateur) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    
    // Upload files to Cloudinary
    const uploadPromises: Promise<string | null>[] = [];
    
    // Helper function for file uploads
    const uploadFile = async (file: File | null, folderName: string): Promise<string | null> => {
      if (!file) return null;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        return new Promise<string | null>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `restaurants/${folderName}`,
              resource_type: "auto",
            },
            (error, result) => {
              if (error) {
                console.error(`Error uploading ${folderName}:`, error);
                // Fix: Reject with an Error object instead of directly passing the error
                reject(new Error(`Failed to upload ${folderName}: ${error.message}`));
              } else {
                resolve(result?.secure_url ?? null);
              }
            }
          );
          
          uploadStream.end(buffer);
        });
      } catch (error) {
        console.error(`Error processing ${folderName}:`, error);
        return null;
      }
    };
    
    // Queue up file uploads
    uploadPromises.push(uploadFile(utilityBill, "utility_bills"));
    uploadPromises.push(uploadFile(businessLicense, "business_licenses"));
    uploadPromises.push(uploadFile(foodHygieneCert, "food_hygiene_certs"));
    uploadPromises.push(uploadFile(storefrontPhoto, "storefront_photos"));
    uploadPromises.push(uploadFile(receiptPhoto, "receipt_photos"));
    
    // Wait for all uploads to complete
    const [
      utilityBillUrl,
      businessLicenseUrl,
      foodHygieneCertUrl,
      storefrontPhotoUrl,
      receiptPhotoUrl,
    ] = await Promise.all(uploadPromises);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create restaurateur record
    const restaurateur = await db.restaurateur.create({
      data: {
        email,
        password: hashedPassword,
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
        contactPersonEmail,
        utilityBillUrl,
        businessLicenseUrl,
        foodHygieneCertUrl,
        storefrontPhotoUrl,
        receiptPhotoUrl,
        verificationStatus: "pending",
      },
    });
    
    // Create restaurant record associated with the restaurateur
    const restaurant = await db.restaurant.create({
      data: {
        title: restaurantName,
        rating: "0",
        num_reviews: "0",
        location: `${city}, ${country}`,
        category: [], // Added empty array for category field
        restaurateurs: {
          connect: {
            id: restaurateur.id,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Restaurant registration submitted for review",
    });
    
  } catch (error) {
    console.error("Restaurant registration error:", error);
    return NextResponse.json({
      error: "Registration failed. Please try again later.",
    }, { status: 500 });
  }
}