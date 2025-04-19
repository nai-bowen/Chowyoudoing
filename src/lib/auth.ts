/*eslint-disable */
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { User } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // Normalize email to lowercase for consistency
        const email = credentials.email.toLowerCase().trim();
        
        // Default to patron if userType is not specified
        const userType = credentials.userType || "patron";

        // Check if this is a restaurateur login
        if (userType === "restaurateur") {
          // Try to find the restaurateur with case-insensitive email matching
          const restaurateur = await prisma.restaurateur.findFirst({
            where: { 
              email: {
                equals: email,
                mode: "insensitive" // Case-insensitive comparison
              }
            },
          });

          if (restaurateur) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              restaurateur.password
            );

            if (!isValidPassword) {
              throw new Error("Incorrect password.");
            }

            return {
              id: restaurateur.id,
              email: restaurateur.email,
              name: restaurateur.contactPersonName,
              userType: "restaurateur"
            };
          }

          // If not found directly, check RestaurateurAccount with case-insensitive match
          const restaurateurAccount = await prisma.restaurateurAccount.findFirst({
            where: { 
              email: {
                equals: email,
                mode: "insensitive" // Case-insensitive comparison
              }
            },
            include: { restaurateur: true }
          });

          if (restaurateurAccount && restaurateurAccount.password) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              restaurateurAccount.password
            );

            if (!isValidPassword) {
              throw new Error("Incorrect password.");
            }

            return {
              id: restaurateurAccount.restaurateurId,
              email: restaurateurAccount.email,
              name: restaurateurAccount.restaurateur.contactPersonName,
              userType: "restaurateur"
            };
          }

          throw new Error("No restaurateur found with this email.");
        } 
        
        // Patron login (default) - Use case-insensitive match
        const patron = await prisma.patron.findFirst({
          where: { 
            email: {
              equals: email,
              mode: "insensitive" // Case-insensitive comparison
            }
          },
        });

        if (!patron) {
          console.log(`No patron found with email: ${email}`);
          throw new Error("No user found.");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          patron.password
        );

        if (!isValidPassword) {
          throw new Error("Incorrect password.");
        }

        return {
          id: patron.id,
          email: patron.email,
          name: `${patron.firstName} ${patron.lastName}`,
          firstName: patron.firstName,
          lastName: patron.lastName,
          interests: patron.interests,
          userType: "patron"
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle OAuth providers, not credentials
      if (account?.provider === "google" && user.email) {
        try {
          // Check if this email already exists as a patron
          const existingPatron = await prisma.patron.findFirst({
            where: {
              email: {
                equals: user.email,
                mode: "insensitive"
              }
            }
          });

          // If user doesn't exist yet, create a new patron record
          if (!existingPatron) {
            // Extract name parts - handle null or undefined values
            const nameParts = (user.name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

            // Create a random secure password for Google users
            const randomPassword = await bcrypt.hash(
              Math.random().toString(36).slice(2) + Date.now().toString(36), 
              10
            );

            try {
              // Create the new patron account
              const newPatron = await prisma.patron.create({
                data: {
                  email: user.email,
                  firstName: firstName,
                  lastName: lastName,
                  password: randomPassword,
                  interests: []
                }
              });
              
              console.log(`Created new patron for Google user: ${user.email} with ID: ${newPatron.id}`);
              
              // After successful creation, add the ID to the user object
              user.id = newPatron.id;
              (user as User).firstName = firstName;
              (user as User).lastName = lastName;
              (user as User).userType = "patron";
              (user as User).interests = [];
              (user as User).needsProfileCompletion = true; // Mark as needing completion
            } catch (createError) {
              console.error("Error creating patron:", createError);
              return false; // Prevent sign in if we can't create the user
            }
          } else {
            // If user exists, use their ID
            user.id = existingPatron.id;
            // Update the user object with patron data
            (user as User).firstName = existingPatron.firstName;
            (user as User).lastName = existingPatron.lastName;
            (user as User).userType = "patron";
            (user as User).interests = existingPatron.interests;
            
            // Check if the user needs to complete their profile (no interests)
            if (!existingPatron.interests || existingPatron.interests.length === 0) {
              (user as User).needsProfileCompletion = true;
            }
          }
        } catch (error) {
          console.error("Error handling Google sign-in:", error);
          return false; // Prevent sign in on error
        }
      }
      return true; // Allow sign in
    },
    
    async jwt({ token, user, account }) {
      // Save account info to token
      if (account) {
        token.provider = account.provider;
      }
      
      // If this is coming from a sign-in, add user data to token
      if (user) {
        token.id = user.id;
        
        // Use type assertion for custom properties
        const typedUser = user as User;
        token.userType = typedUser.userType || "patron";
        
        // Add first/last name if available
        if (typedUser.firstName) token.firstName = typedUser.firstName;
        if (typedUser.lastName) token.lastName = typedUser.lastName;
        if (typedUser.interests) token.interests = typedUser.interests;
        
        // Add the profile completion flag
        if (typedUser.needsProfileCompletion) {
          token.needsProfileCompletion = true;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Add user data from token to session
      if (session.user) {
        session.user.id = token.id;
        session.user.userType = token.userType || "patron";
        
        // Add additional fields if available
        if (token.firstName) session.user.firstName = token.firstName;
        if (token.lastName) session.user.lastName = token.lastName;
        if (token.interests) session.user.interests = token.interests;
        
        // Add the profile completion flag to the session
        if (token.needsProfileCompletion) {
          session.user.needsProfileCompletion = true;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};