import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
}

export function signJwt(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}
