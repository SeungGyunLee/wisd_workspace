import { Router, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getConnection } from '../config/database.js'
import { AuthenticatedRequest, authMiddleware, JWT_SECRET } from '../middleware/auth.js'
import { validateEmail, validatePassword } from '../utils/validation.js'
import { ValidationError, UnauthorizedError } from '../utils/errors.js'

const router = Router()

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/signup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password) {
      throw new ValidationError('이메일과 비밀번호는 필수입니다')
    }

    validateEmail(email)
    validatePassword(password)

    const conn = await getConnection()

    try {
      const existingUser = await conn.execute(
        'SELECT id FROM users WHERE email = :email',
        { email }
      )

      if (existingUser.rows && existingUser.rows.length > 0) {
        throw new ValidationError('이미 가입된 이메일입니다')
      }

      const userId = uuidv4()
      const hashedPassword = await bcrypt.hash(password, 10)
      const name = displayName || email.split('@')[0]

      await conn.execute(
        `INSERT INTO users (id, email, password_hash, display_name, created_at)
         VALUES (:id, :email, :passwordHash, :displayName, CURRENT_TIMESTAMP)`,
        {
          id: userId,
          email,
          passwordHash: hashedPassword,
          displayName: name,
        }
      )

      await conn.commit()

      const token = generateToken(userId, email)

      res.status(201).json({
        user: { id: userId, email, displayName: name },
        session: { access_token: token, token_type: 'bearer' },
      })
    } finally {
      await conn.close()
    }
  } catch (err) {
    throw err
  }
})

router.post('/signin', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new ValidationError('이메일과 비밀번호는 필수입니다')
    }

    const conn = await getConnection()

    try {
      const result = await conn.execute(
        `SELECT id, email, password_hash, display_name FROM users WHERE email = :email`,
        { email }
      )

      if (!result.rows || result.rows.length === 0) {
        throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다')
      }

      const row = result.rows[0] as any[]
      const userId = row[0]
      const userEmail = row[1]
      const passwordHash = row[2]
      const displayName = row[3]

      const isValid = await bcrypt.compare(password, passwordHash)
      if (!isValid) {
        throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다')
      }

      const token = generateToken(userId, userEmail)

      res.json({
        user: { id: userId, email: userEmail, displayName },
        session: { access_token: token, token_type: 'bearer' },
      })
    } finally {
      await conn.close()
    }
  } catch (err) {
    throw err
  }
})

router.get(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      res.json({
        id: req.userId,
        email: req.userEmail,
      })
    } catch (err) {
      throw err
    }
  }
)

router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new ValidationError('refreshToken은 필수입니다')
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      userId: string
      email: string
    }

    const newToken = generateToken(decoded.userId, decoded.email)

    res.json({
      session: { access_token: newToken, token_type: 'bearer' },
    })
  } catch (err) {
    throw new UnauthorizedError('토큰 새로고침에 실패했습니다')
  }
})

router.post(
  '/logout',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      res.json({
        message: '로그아웃되었습니다',
      })
    } catch (err) {
      throw err
    }
  }
)

export default router
