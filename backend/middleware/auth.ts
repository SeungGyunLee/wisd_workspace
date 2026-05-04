import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/errors.js'

const JWT_SECRET = process.env.JWT_SECRET || 'wisd-workspace-secret-key-change-in-production'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userEmail?: string
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new UnauthorizedError('Authorization 헤더가 필요합니다')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new UnauthorizedError('토큰 형식이 올바르지 않습니다')
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
    }

    req.userId = decoded.userId
    req.userEmail = decoded.email

    next()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error)
    } else {
      next(new UnauthorizedError('유효하지 않은 토큰입니다'))
    }
  }
}

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
    }

    if (decoded) {
      req.userId = decoded.userId
      req.userEmail = decoded.email
    }

    next()
  } catch (error) {
    next()
  }
}

export { JWT_SECRET }
