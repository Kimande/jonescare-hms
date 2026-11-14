import bcrypt from 'bcrypt'
import { Router } from 'express'
import { z } from 'zod'
import { signToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const { email, password } = parsed.data

  const user = await prisma.users.findUnique({ where: { email } })
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
})

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.users.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
})
// PUBLIC ROUTE: Allow creating an admin account without requiring access to an existing one
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }

    const existingUser = await prisma.users.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.users.create({
      data: {
        name,
        email,
        phone: phone || '0700000000',
        gender: 'OTHER',
        role: 'ADMIN',
        password_hash: passwordHash,
        status: 'ACTIVE',
      },
    })

    res.status(201).json({ message: 'Admin registered successfully!' })
  } catch (error) {
    console.error('Admin registration failed:', error)
    res.status(500).json({ error: 'Failed to register admin.' })
  }
})

export default router
