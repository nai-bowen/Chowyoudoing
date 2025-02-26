// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const type = formData.get("type") as string || 'image';
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 7MB size limit" }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: type === "image" ? "image" : "video",
          folder: "reviews",
          transformation: type === "image" ? [{ width: 800, crop: "limit" }] : undefined,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            reject(new Error(error.message || "Cloudinary upload failed"));
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
    
    if (typeof result === 'object' && result !== null && 
        'secure_url' in result && 'public_id' in result) {
      return NextResponse.json({
        url: (result as {secure_url: string}).secure_url,
        public_id: (result as {public_id: string}).public_id
      });
    } else {
      throw new Error('Invalid upload result structure');
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}