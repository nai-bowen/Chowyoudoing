/* eslint-disable */


import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db";

// Create the custom adapter
export const CustomPrismaAdapter = PrismaAdapter(db) as any;

// Override default user methods to map `Patron` instead of `User`
CustomPrismaAdapter.getUser = (id: string) =>
  db.patron.findUnique({ where: { id } });

CustomPrismaAdapter.getUserByEmail = (email: string) =>
  db.patron.findUnique({ where: { email } });

CustomPrismaAdapter.createUser = (user: any) =>
    db.patron.create({
      data: {
        email: user.email,
        firstName: user.name?.split(" ")[0] || "FirstName",
        lastName: user.name?.split(" ")[1] || "LastName",
        password: "oauth_dummy_password",  // ✅ Add a dummy password for OAuth users
        
      },
    });

    CustomPrismaAdapter.linkAccount = (account: any) =>
        db.account.create({
          data: {
            provider: account.provider,
            type: account.type,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
            id_token: account.id_token,
            patronId: account.userId,  // ✅ Correct mapping to patronId
          },
        });
      

CustomPrismaAdapter.getUserByAccount = (account: any) =>
  db.account
    .findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      include: { patron: true },
    })
    .then((acc) => acc?.patron ?? null);
