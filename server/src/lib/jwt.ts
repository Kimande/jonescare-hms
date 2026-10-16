import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET as string
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

if (!SECRET) {
  throw new Error('JWT_SECRET is not set in .env')
}

export type JwtPayload = {
  id: number
  email: string
  role: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload
}
