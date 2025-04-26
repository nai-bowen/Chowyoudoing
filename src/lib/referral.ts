// src/lib/referral.ts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Generates a unique referral code
 * @returns Promise<string> A unique 8-character referral code
 */
export async function generateUniqueReferralCode(): Promise<string> {
  // Keep trying until we get a unique code
  while (true) {
    // Generate a random alphanumeric string (8 characters)
    const code = generateReferralCode();
    
    // Check if this code already exists
    const existingCode = await prisma.restaurateur.findUnique({
      where: { referralCode: code }
    });
    
    // If the code doesn't exist, return it
    if (!existingCode) {
      return code;
    }
    
    // Otherwise, try again with a new code
  }
}

/**
 * Generates a random 8-character referral code
 * @returns string A random 8-character alphanumeric code
 */
function generateReferralCode(): string {
  // Define characters to use in the code (alphanumeric, excluding ambiguous characters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  // Generate 8 random bytes
  const randomBytes = crypto.randomBytes(8);
  
  // Convert bytes to code characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    // Use modulo to get an index within our chars string
    const byte = randomBytes[i]!;
    const index = byte % chars.length;
        code += chars[index];
  }
  
  return code;
}

/**
 * Records a successful referral and updates user points
 * @param referralCode The referral code used
 * @param userId The ID of the user who signed up
 * @param userType The type of user ("patron" or "restaurateur")
 * @returns Promise<boolean> Whether the referral was successfully recorded
 */
export async function recordReferral(
  referralCode: string,
  userId: string,
  userType: "patron" | "restaurateur"
): Promise<boolean> {
  try {
    // Only restaurateurs can be referrers
    const referrer = await prisma.restaurateur.findUnique({
      where: { referralCode }
    });

    if (!referrer) {
      return false; // Invalid referral code
    }

    // Create the referral record
    await prisma.referral.create({
      data: {
        referralCode,
        referrerType: "restaurateur", // Always restaurateur
        referrerId: referrer.id,
        referredType: userType, // 'patron' or 'restaurateur'
        referredId: userId,
      }
    });

    // Increment the restaurateur's referral points
    await prisma.restaurateur.update({
      where: { id: referrer.id },
      data: {
        referralPoints: { increment: 1 }
      }
    });

    // Apply bonus if earned
    await checkAndApplyReferralBonus(referrer.id);

    return true;

  } catch (error) {
    console.error("Error recording referral:", error);
    return false;
  }
}

/**
 * Checks if a restaurateur has earned new premium bonuses and applies them
 * @param restaurateurId The ID of the restaurateur to check
 */
export async function checkAndApplyReferralBonus(restaurateurId: string): Promise<void> {
  try {
    // Get current referral stats
    const restaurateur = await prisma.restaurateur.findUnique({
      where: { id: restaurateurId },
      select: {
        referralPoints: true,
        referralBonusesEarned: true,
        isPremium: true,
        premiumExpiresAt: true
      }
    });
    
    if (!restaurateur) return;
    
    // Calculate how many new bonuses should have been earned (1 bonus per 5 points)
    const totalBonusesEarned = Math.floor(restaurateur.referralPoints / 5);
    const newBonusesEarned = totalBonusesEarned - restaurateur.referralBonusesEarned;
    
    if (newBonusesEarned <= 0) return; // No new bonuses
    
    // Update the earned bonuses count
    await prisma.restaurateur.update({
      where: { id: restaurateurId },
      data: {
        referralBonusesEarned: totalBonusesEarned,
      }
    });
    
    // Apply the premium time if the user is already premium
    if (restaurateur.isPremium && restaurateur.premiumExpiresAt) {
      // Add 1 month per bonus
      const newExpiryDate = new Date(restaurateur.premiumExpiresAt);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + newBonusesEarned);
      
      await prisma.restaurateur.update({
        where: { id: restaurateurId },
        data: {
          premiumExpiresAt: newExpiryDate,
          referralBonusesUsed: { increment: newBonusesEarned }
        }
      });
    }
    
    // If user is not premium, we'll apply the bonus when they upgrade (handled elsewhere)
  } catch (error) {
    console.error("Error checking referral bonus:", error);
  }
}

/**
 * Applies pending referral bonuses when a user upgrades to premium
 * @param restaurateurId The ID of the restaurateur upgrading to premium
 * @param currentExpiryDate The current premium expiry date to extend
 * @returns Date The new expiry date after applying bonuses
 */
export async function applyPendingReferralBonuses(
  restaurateurId: string,
  currentExpiryDate: Date
): Promise<Date> {
  try {
    const restaurateur = await prisma.restaurateur.findUnique({
      where: { id: restaurateurId },
      select: {
        referralBonusesEarned: true,
        referralBonusesUsed: true
      }
    });
    
    if (!restaurateur) return currentExpiryDate;
    
    // Calculate unused bonuses
    const unusedBonuses = restaurateur.referralBonusesEarned - restaurateur.referralBonusesUsed;
    
    if (unusedBonuses <= 0) return currentExpiryDate;
    
    // Apply the bonuses (1 month per bonus)
    const newExpiryDate = new Date(currentExpiryDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + unusedBonuses);
    
    // Update the used bonuses count
    await prisma.restaurateur.update({
      where: { id: restaurateurId },
      data: {
        referralBonusesUsed: restaurateur.referralBonusesEarned
      }
    });
    
    return newExpiryDate;
  } catch (error) {
    console.error("Error applying pending referral bonuses:", error);
    return currentExpiryDate;
  }
}

/**
 * Checks if a referral code is valid (exists in the database)
 * @param referralCode The referral code to validate
 * @returns Promise<boolean> Whether the referral code is valid
 */
export async function isValidReferralCode(referralCode: string): Promise<boolean> {
  try {
    if (!referralCode || referralCode.trim() === "") {
      return false; // Empty or null referral code is invalid
    }

    // Look for a restaurateur with this referral code
    const restaurateur = await prisma.restaurateur.findUnique({
      where: { referralCode },
      select: { id: true } // Only need to check if it exists
    });

    return !!restaurateur; // Return true if found, false otherwise
  } catch (error) {
    console.error("Error validating referral code:", error);
    return false; // On error, consider the code invalid
  }
}