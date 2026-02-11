import jwt from 'jsonwebtoken'
import { promisify } from 'util'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import prisma from '../config/prisma.js'

const verifyToken = promisify(jwt.verify)

export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null

  if (!token) {
    throw new ApiError(401, 'Access token not provided')
  }

  let decoded
  try {
    decoded = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET)
  } catch (error) {
    throw new ApiError(403, 'Invalid or expired token')
  }

  // 🔍 Verify user exists in PostgreSQL via Prisma
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
    }
  })

  if (!user) {
    throw new ApiError(401, 'User no longer exists')
  }

  // Attach verified user to request
  req.user = user

  next()
})

export default authenticateToken
