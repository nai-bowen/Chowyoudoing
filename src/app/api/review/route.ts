/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

interface FormattedReview {
  patronId: string;
  id: string;
  title: string;
  date: string|undefined;
  upvotes: number;
  content: string;
  text: string;
  rating: number;
  restaurant: string;
  restaurantId: string;
  author: string;
  asExpected: number;
  wouldRecommend: number;
  valueForMoney: number;
  imageUrl: string | null;
  videoUrl: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isAnonymous: boolean; // Add this field
  patron?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  userVote?: {
    isUpvote: boolean;
  } | null;
}
interface ReviewStandards {
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
}

interface ReviewRequestBody {
  restaurantId?: string;
  restaurant?: string;
  menuItemId?: string;
  menuItem?: string;
  content: string;
  rating?: number;
  imageUrl?: string;
  videoUrl?: string;
  latitude?: number;
  longitude?: number;
  standards?: ReviewStandards;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
  isAnonymous?: boolean; // Add this field
}

interface VoteRequestBody {
  reviewId: string;
  action: 'upvote' | 'downvote' | 'cancel-upvote' | 'cancel-downvote';
}

// GET handler - handles both general reviews and user-specific reviews
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Reviews API: Beginning GET request processing");
    
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    
    // Get the query parameters
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 10;
    const page = Number(url.searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;
    const userId = url.searchParams.get("userId");
    const restaurantId = url.searchParams.get("restaurantId");
    const menuItemId = url.searchParams.get("menuItemId");
    const includeLocation = url.searchParams.get("includeLocation") === "true";
    const hasImage = url.searchParams.get("hasImage") === "true";
    const orderBy = url.searchParams.get("orderBy") || ""; // Custom sorting field
    const orderDir = url.searchParams.get("orderDir") || "desc"; // Direction of sorting
    const interestsParam = url.searchParams.getAll("interests"); // Get all interests
    const minRating = Number(url.searchParams.get("minRating")) || 0; // Minimum rating filter
    const strictInterests = url.searchParams.get("strictInterests") === "true"; // Whether to strictly filter by interests
    
    // Log received parameters for debugging
    console.log("Reviews API: Query parameters", {
      limit, page, userId, restaurantId, menuItemId, includeLocation, 
      hasImage, orderBy, orderDir, interests: interestsParam, minRating,
      strictInterests
    });
    
    // Base query conditions for prisma
    const baseWhereClause: Prisma.ReviewWhereInput = {};
    
    // Add filters to the where clause
    if (userId) {
      console.log(`Reviews API: Fetching reviews for specific user ID: ${userId}`);
      baseWhereClause.patronId = userId;
    }
    
    if (restaurantId) {
      console.log(`Reviews API: Filtering by restaurant ID: ${restaurantId}`);
      baseWhereClause.restaurantId = restaurantId;
    }
    
    if (menuItemId) {
      console.log(`Reviews API: Filtering by menu item ID: ${menuItemId}`);
      baseWhereClause.menuItemId = menuItemId;
    }
    
    // Filter for minimum rating if provided
    if (minRating > 0) {
      console.log(`Reviews API: Filtering for minimum rating: ${minRating}`);
      baseWhereClause.rating = {
        gte: minRating
      };
    }
    
    // Filter for reviews with images if requested
    if (hasImage) {
      console.log("Reviews API: Filtering for reviews with images");
      baseWhereClause.imageUrl = {
        not: null
      };
      // Add a second condition to ensure it's not an empty string
      baseWhereClause.AND = [
        {
          imageUrl: {
            not: ""
          }
        }
      ];
    }
    
    // If no specific filters, check if we want current user's reviews
    if (!userId && !restaurantId && !menuItemId) {
      const userFilter = url.searchParams.get("userReviews") === "true";
      
      // If userReviews=true in query and we have a session, get the current user's reviews
      if (userFilter && currentUserId) {
        console.log(`Reviews API: Fetching reviews for current user: ${currentUserId}`);
        baseWhereClause.patronId = currentUserId;
      }
    }
    
    // Determine fields to select
    const selectFields: Prisma.ReviewSelect = {
      id: true,
      content: true,
      rating: true,
      createdAt: true,
      upvotes: true,
      asExpected: true,
      wouldRecommend: true,
      valueForMoney: true,
      imageUrl: true,
      videoUrl: true,
      restaurantId: true, 
      isAnonymous: true,
      patron: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      restaurant: {
        select: {
          id: true,
          title: true,
          location: true,
          category: true, // Include category to match interests
          interests: true // Include interests to match user interests
        }
      },
      menuItem: {
        select: {
          id: true,
          name: true
        }
      }
    };
    
    // Include user votes if user is logged in
    if (currentUserId) {
      selectFields.votes = {
        where: {
          userId: currentUserId
        },
        select: {
          isUpvote: true
        }
      };
    }
    
    // Include location data if requested
    if (includeLocation) {
      selectFields.latitude = true;
      selectFields.longitude = true;
    }
    
    // Process interests filter - if interests are specified, get reviews for restaurants with matching interests
    let interests: string[] = interestsParam;
    
    // If no interests were provided in query, try to get user interests from their profile
    if (interests.length === 0 && currentUserId) {
      try {
        // Attempt to fetch user interests from their profile
        const patron = await db.patron.findUnique({
          where: { id: currentUserId },
          select: { interests: true }
        });
        
        if (patron && patron.interests && patron.interests.length > 0) {
          interests = patron.interests;
          console.log("Reviews API: Retrieved user interests:", interests);
        }
      } catch (error) {
        console.error("Error fetching user interests:", error);
      }
    }
    
    // Create a copy of the base where clause
    let whereClause: Prisma.ReviewWhereInput = { ...baseWhereClause };
    
    // Apply interests filter if we have interests to filter by
    if (interests.length > 0) {
      console.log("Reviews API: Applying interests filter with:", interests);
      
      // We need to fetch restaurants that match user interests
      // Either by explicit interests or by categories that overlap with interests
      whereClause.OR = [
        {
          restaurant: {
            interests: {
              hasSome: interests
            }
          }
        },
        {
          restaurant: {
            category: {
              hasSome: interests
            }
          }
        }
      ];
    }
    
    // Determine sorting method
    const sortOptions: Prisma.ReviewOrderByWithRelationInput = {};
    
    if (orderBy === "createdAt") {
      // Sort by creation date
      sortOptions.createdAt = orderDir as Prisma.SortOrder;
      console.log(`Reviews API: Sorting by creation date ${orderDir}`);
    } else if (orderBy === "rating") {
      // Sort by rating
      sortOptions.rating = orderDir as Prisma.SortOrder;
      console.log(`Reviews API: Sorting by rating ${orderDir}`);
    } else if (orderBy === "upvotes") {
      // Sort by popularity (upvotes)
      sortOptions.upvotes = orderDir as Prisma.SortOrder;
      console.log(`Reviews API: Sorting by upvotes ${orderDir}`);
    } else {
      // Default sorting - depends on the query type
      if (Object.keys(whereClause).length > 0) {
        // For filtered reviews, default to newest first
        sortOptions.createdAt = 'desc';
        console.log("Reviews API: Using default sort by createdAt desc for filtered reviews");
      } else {
        // For general reviews, default to most popular
        sortOptions.upvotes = 'desc';
        console.log("Reviews API: Using default sort by upvotes desc for general reviews");
      }
    }
    
    console.log("Reviews API: Executing query with filters and sorting");
    
    // Final result array
    let reviews: any[] = [];
    
    // Fetch reviews that match interests first
    if (interests.length > 0) {
      // First try to get reviews that match interests
      const interestMatchedReviews = await db.review.findMany({
        where: whereClause,
        select: selectFields,
        orderBy: sortOptions,
        take: limit,
        skip: skip
      });
      
      console.log(`Reviews API: Found ${interestMatchedReviews.length} reviews matching interests`);
      
      reviews = interestMatchedReviews;
      
      // If we don't have enough reviews and not using strict interest matching, 
      // fetch additional random reviews to fill the limit
      if (!strictInterests && interestMatchedReviews.length < limit) {
        const remainingLimit = limit - interestMatchedReviews.length;
        console.log(`Reviews API: Fetching ${remainingLimit} additional random reviews to fill limit`);
        
        // Get already fetched review IDs to exclude them
        const existingIds = interestMatchedReviews.map(review => review.id);
        
        // Create a where clause for random reviews that excludes already fetched ones
        // and still respects the base filters (hasImage, rating, etc.)
        const randomWhereClause: Prisma.ReviewWhereInput = {
          ...baseWhereClause,
          id: {
            notIn: existingIds
          }
        };
        
        // Fetch random reviews to fill the gap
        const randomReviews = await db.review.findMany({
          where: randomWhereClause,
          select: selectFields,
          orderBy: sortOptions,
          take: remainingLimit
        });
        
        console.log(`Reviews API: Found ${randomReviews.length} additional random reviews`);
        
        // Combine interest-matched reviews with random ones
        reviews = [...interestMatchedReviews, ...randomReviews];
      }
    } else {
      // If no interests specified, just use the base query
      reviews = await db.review.findMany({
        where: baseWhereClause,
        select: selectFields,
        orderBy: sortOptions,
        take: limit,
        skip: skip
      });
      
      console.log(`Reviews API: Found ${reviews.length} reviews with base filters`);
    }
    
// Update the formatted reviews mapping in your GET handler:

    const formattedReviews = reviews.map((review) => {
      // Ensure `createdAt` is always treated as a Date
      const createdAt: Date = review.createdAt ?? new Date(); // Default to current date
      
      // Ensure upvotes is a number, default to 0 if null/undefined
      const upvotesValue: number = typeof review.upvotes === 'number' ? review.upvotes : 0;

      const formattedReview: FormattedReview = {
        id: review.id,
        title: review.menuItem?.name ?? review.restaurant?.title ?? "Review",
        date: createdAt.toISOString().split("T")[0], // Convert Date to string
        upvotes: upvotesValue,
        content: review.content,
        text: review.content,
        rating: review.rating,
        restaurant: `${review.restaurant?.title ?? "Restaurant"}${review.restaurant?.location ? ` - ${review.restaurant.location}` : ""}`,
        restaurantId: review.restaurantId || "", // Include the restaurantId
        isAnonymous: review.isAnonymous ?? false, // Include anonymous flag with default
        author: (review.isAnonymous) 
          ? "Anonymous" 
          : (review.patron
              ? `${review.patron.firstName} ${review.patron.lastName.charAt(0)}.`
              : "Anonymous"),
        asExpected: review.asExpected ?? 0,
        wouldRecommend: review.wouldRecommend ?? 0,
        valueForMoney: review.valueForMoney ?? 0,
        imageUrl: review.imageUrl ?? null,
        videoUrl: review.videoUrl ?? null,
        patronId: review.patronId,
      };

      if (includeLocation && review.latitude !== undefined && review.longitude !== undefined) {
        formattedReview.latitude = review.latitude;
        formattedReview.longitude = review.longitude;
      }
      
      // Only include patron data if not anonymous
      if (!review.isAnonymous && review.patron) {
        formattedReview.patron = review.patron
          ? {
              id: review.patron.id,
              firstName: review.patron.firstName,
              lastName: review.patron.lastName,
            }
          : undefined;
      }
      
      formattedReview.patronId = review.patron?.id || review.patronId;
      
      // Include the user's vote if available
      if (currentUserId && review.votes?.length) {
        formattedReview.userVote = {
          isUpvote: review.votes[0]?.isUpvote ?? false, // Ensure a default boolean value
        };
      } else {
        formattedReview.userVote = null;
      }

      return formattedReview;
    });
    
    console.log("Reviews API: Reviews formatted for response", {
      count: formattedReviews.length
    });
    
    // Get total count for pagination
    // For interests-based queries with fallback, calculating total count is more complex
    let totalCount: number;
    
    if (interests.length > 0 && !strictInterests) {
      // For non-strict interest matching, count all reviews that match the base criteria
      totalCount = await db.review.count({
        where: baseWhereClause
      });
    } else {
      // For strict interest matching or no interests, count with the full where clause
      totalCount = await db.review.count({
        where: whereClause
      });
    }
    
    // Return formatted reviews with pagination info
    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Reviews API: Error fetching reviews:", error);
    return NextResponse.json({ 
      error: "Failed to fetch reviews", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// POST handler for creating reviews or handling votes
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Review API: Beginning request processing");
    
    // Get server session with authOptions
    const session = await getServerSession(authOptions);
    console.log("Review API: Session data retrieved:", { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session || !session.user || !session.user.id) {
      console.log("Review API: Unauthorized - No valid session or user ID");
      return NextResponse.json({ error: "Unauthorized - Please log in to submit a review" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Check if this is a vote request
    if (body.reviewId && body.action) {
      return handleVote(body as VoteRequestBody, session.user.id);
    }
    
    const reviewBody = body as ReviewRequestBody;
    console.log("Review API: Request body received", {
      hasRestaurantId: !!reviewBody.restaurantId,
      hasRestaurant: !!reviewBody.restaurant,
      hasMenuItem: !!reviewBody.menuItem,
      hasMenuItemId: !!reviewBody.menuItemId,
      contentLength: reviewBody.content?.length,
      hasLocation: !!reviewBody.latitude && !!reviewBody.longitude,
      isAnonymous: !!reviewBody.isAnonymous // Log anonymous flag
    });

    // Support both the original and new API formats
    const restaurantId = reviewBody.restaurantId;
    const restaurant = reviewBody.restaurant;
    const menuItemId = reviewBody.menuItemId;
    const menuItem = reviewBody.menuItem;
    const content = reviewBody.content;
    const rating = reviewBody.rating || 5;
    const imageUrl = reviewBody.imageUrl;
    const videoUrl = reviewBody.videoUrl;
    const latitude = reviewBody.latitude;
    const longitude = reviewBody.longitude;
    const isAnonymous = reviewBody.isAnonymous || false; // Default to false
    
    // Get the standards from either format
    const standards: ReviewStandards = reviewBody.standards || {
      asExpected: reviewBody.asExpected || 0,
      wouldRecommend: reviewBody.wouldRecommend || 0,
      valueForMoney: reviewBody.valueForMoney || 0
    };
    
    // Validate input
    if ((!restaurantId && !restaurant) || !content || content.length < 10) {
      console.log("Review API: Invalid input", { 
        hasRestaurantId: !!restaurantId,
        hasRestaurant: !!restaurant,
        contentLength: content?.length 
      });
      return NextResponse.json({ error: "Invalid input - Restaurant and content are required" }, { status: 400 });
    }
    
    // Find or create restaurant based on provided info
    let restaurantRecord;
    if (restaurantId) {
      // If restaurantId is provided, find it directly
      console.log("Review API: Finding restaurant by ID", { restaurantId });
      restaurantRecord = await db.restaurant.findUnique({
        where: { id: restaurantId }
      });
      
      if (!restaurantRecord) {
        console.log("Review API: Restaurant not found with ID:", restaurantId);
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }
    } else {
      // Otherwise, find or create by name
      console.log("Review API: Finding restaurant by name", { restaurantName: restaurant });
      restaurantRecord = await db.restaurant.findFirst({
        where: { title: restaurant }
      });
      
      if (!restaurantRecord) {
        console.log("Review API: Restaurant not found, creating new record");
        
        // Create restaurant without coordinates (they're not in the Restaurant model)
        restaurantRecord = await db.restaurant.create({
          data: {
            title: restaurant!,
            rating: "0", // Initial rating
            num_reviews: "0", // Initial count
            category: []  // No categories initially
          }
        });
        console.log("Review API: New restaurant created", { restaurantId: restaurantRecord.id });
      } else {
        console.log("Review API: Existing restaurant found", { restaurantId: restaurantRecord.id });
      }
    }
    
    // Find menu item if provided
    let menuItemRecord = null;
    if (menuItemId) {
      // If menuItemId is provided, find it directly
      console.log("Review API: Finding menu item by ID", { menuItemId });
      menuItemRecord = await db.menuItem.findUnique({
        where: { id: menuItemId }
      });
    } else if (menuItem) {
      // Otherwise, find by name
      console.log("Review API: Finding menu item by name", { menuItemName: menuItem });
      menuItemRecord = await db.menuItem.findFirst({
        where: { name: menuItem }
      });
    }
    
    console.log("Review API: Menu item search result", { found: !!menuItemRecord });
    
    // Convert standards to integers (from 1-5) or use 0 as default
    const asExpectedRating = standards?.asExpected ? parseInt(String(standards.asExpected)) : 0;
    const wouldRecommendRating = standards?.wouldRecommend ? parseInt(String(standards.wouldRecommend)) : 0;
    const valueForMoneyRating = standards?.valueForMoney ? parseInt(String(standards.valueForMoney)) : 0;
    
    // Find patron record to ensure it exists
    const patron = await db.patron.findUnique({
      where: { id: session.user.id }
    });
    
    if (!patron) {
      console.log("Review API: Patron not found with ID:", session.user.id);
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }
    
    // Create review with proper typing
    const reviewData: Prisma.ReviewCreateInput = {
      content,
      rating: rating,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      upvotes: 0,
      asExpected: asExpectedRating,
      wouldRecommend: wouldRecommendRating,
      valueForMoney: valueForMoneyRating,
      isAnonymous: isAnonymous, // Add the anonymous flag to the review data
      
      // Connect to patron
      patron: {
        connect: { id: session.user.id }
      },
      
      // Connect to restaurant
      restaurant: {
        connect: { id: restaurantRecord.id }
      },
    };
    // Add location data if provided (these fields exist in the Review model)
    if (latitude !== undefined && longitude !== undefined) {
      reviewData.latitude = latitude;
      reviewData.longitude = longitude;
    }
    
    console.log("Review API: Preparing review data", { 
      userId: session.user.id,
      restaurantId: restaurantRecord.id,
      hasMenuItemConnection: !!menuItemRecord,
      hasLocationData: !!latitude && !!longitude
    });
    
    // Add menu item connection if found
    if (menuItemRecord) {
      reviewData.menuItem = {
        connect: { id: menuItemRecord.id }
      };
    }
    
    console.log("Review API: Creating review record");
    const review = await db.review.create({
      data: reviewData
    });
    console.log("Review API: Review created successfully", { reviewId: review.id });
    
    // Update restaurant review count
    console.log("Review API: Updating restaurant review count");
    await db.restaurant.update({
      where: { id: restaurantRecord.id },
      data: {
        num_reviews: String(parseInt(restaurantRecord.num_reviews || "0") + 1)
      }
    });
    console.log("Review API: Restaurant review count updated");
    
    return NextResponse.json({
      success: true,
      reviewId: review.id,
      restaurantId: restaurantRecord.id
    });
  } catch (error) {
    console.error("Review API: Error during review creation:", error);
    return NextResponse.json({ 
      error: "Failed to create review", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Helper function to handle vote operations
async function handleVote(body: VoteRequestBody, userId: string): Promise<NextResponse> {
  try {
    console.log("Review Vote API: Beginning vote processing", {
      reviewId: body.reviewId,
      action: body.action
    });
    
    const { reviewId, action } = body;
    
    // Check if review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, upvotes: true }
    });
    
    if (!review) {
      console.log("Review Vote API: Review not found", { reviewId });
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    // Check if user has already voted on this review
    const existingVote = await db.$queryRaw`
      SELECT * FROM "UserVotes" 
      WHERE "userId" = ${userId} 
      AND "reviewId" = ${reviewId}
    ` as any[];
    
    let hasUpvoted = false;
    let hasDownvoted = false;
    
    if (existingVote && existingVote.length > 0) {
      hasUpvoted = existingVote[0].isUpvote === true;
      hasDownvoted = existingVote[0].isUpvote === false;
    }
    
    console.log("Review Vote API: User vote status", { 
      hasExistingVote: existingVote && existingVote.length > 0,
      hasUpvoted,
      hasDownvoted
    });
    
    // Calculate new upvote count and update user vote
    // Ensure upvotes is a number, default to 0 if undefined
    let newUpvoteCount = typeof review.upvotes === 'number' ? review.upvotes : 0;
    
    switch (action) {
      case 'upvote':
        if (hasUpvoted) {
          // User already upvoted, do nothing
          console.log("Review Vote API: User already upvoted this review");
        } else if (hasDownvoted) {
          // User previously downvoted, remove downvote and add upvote (+2)
          newUpvoteCount = Math.max(0, newUpvoteCount + 2);
          await db.$executeRaw`
            UPDATE "UserVotes" 
            SET "isUpvote" = true 
            WHERE "userId" = ${userId} 
            AND "reviewId" = ${reviewId}
          `;
          console.log("Review Vote API: Changed downvote to upvote");
        } else {
          // New upvote
          newUpvoteCount++;
          await db.$executeRaw`
            INSERT INTO "UserVotes" ("id", "userId", "reviewId", "isUpvote")
            VALUES (${crypto.randomUUID()}, ${userId}, ${reviewId}, true)
          `;
          console.log("Review Vote API: Added new upvote");
        }
        break;
        
      case 'downvote':
        if (hasDownvoted) {
          // User already downvoted, do nothing
          console.log("Review Vote API: User already downvoted this review");
        } else if (hasUpvoted) {
          // User previously upvoted, remove upvote and add downvote (-2)
          newUpvoteCount = Math.max(0, newUpvoteCount - 2);
          await db.$executeRaw`
            UPDATE "UserVotes" 
            SET "isUpvote" = false 
            WHERE "userId" = ${userId} 
            AND "reviewId" = ${reviewId}
          `;
          console.log("Review Vote API: Changed upvote to downvote");
        } else {
          // New downvote
          newUpvoteCount = Math.max(0, newUpvoteCount - 1);
          await db.$executeRaw`
            INSERT INTO "UserVotes" ("id", "userId", "reviewId", "isUpvote")
            VALUES (${crypto.randomUUID()}, ${userId}, ${reviewId}, false)
          `;
          console.log("Review Vote API: Added new downvote");
        }
        break;
        
      case 'cancel-upvote':
        if (hasUpvoted) {
          // Remove upvote (-1)
          newUpvoteCount = Math.max(0, newUpvoteCount - 1);
          await db.$executeRaw`
            DELETE FROM "UserVotes" 
            WHERE "userId" = ${userId} 
            AND "reviewId" = ${reviewId}
          `;
          console.log("Review Vote API: Removed upvote");
        }
        break;
        
      case 'cancel-downvote':
        if (hasDownvoted) {
          // Remove downvote (+1)
          newUpvoteCount++;
          await db.$executeRaw`
            DELETE FROM "UserVotes" 
            WHERE "userId" = ${userId} 
            AND "reviewId" = ${reviewId}
          `;
          console.log("Review Vote API: Removed downvote");
        }
        break;
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    
    // Update the review's upvote count
    await db.review.update({
      where: { id: reviewId },
      data: { upvotes: newUpvoteCount }
    });
    
    console.log("Review Vote API: Updated upvote count", { 
      reviewId, 
      previousCount: review.upvotes, 
      newCount: newUpvoteCount 
    });
    
    // Return the new upvote count
    return NextResponse.json({ 
      success: true, 
      upvotes: newUpvoteCount,
      reviewId
    });
    
  } catch (error) {
    console.error("Review Vote API: Error processing vote:", error);
    return NextResponse.json({ 
      error: "Failed to process vote", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}