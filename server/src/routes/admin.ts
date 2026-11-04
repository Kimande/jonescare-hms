
import bcrypt from 'bcrypt'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/roles'

const router = Router()

// Apply BOTH middlewares: must be logged in AND must be an ADMIN
router.use(requireAuth, requireRole('ADMIN'))

const CreateStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  role: z.enum(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECH', 'PHARMACIST']),
  licenseNo: z.string().optional(),
})

router.post('/staff', async (req, res) => {
  const parsed = CreateStaffSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid data', details: parsed.error.issues })
  }

  const { name, email, phone, gender, role, licenseNo } = parsed.data

  // Check if email already exists
  const existing = await prisma.users.findUnique({ where: { email } })
  if (existing) {
    return res.status(400).json({ error: 'Email already in use' })
  }

  const passwordHash = await bcrypt.hash('password123', 10) // Default password

  const user = await prisma.users.create({
    data: {
      name,
      email,
      phone,
      gender,
      role,
      license_no: licenseNo || null,
      password_hash: passwordHash,
    },
    select: { id: true, name: true, email: true, role: true }
  })

  res.status(201).json({ user })
})

router.get('/staff', async (req, res) => {
  const staff = await prisma.users.findMany({
    select: { id: true, name: true, email: true, role: true, status: true },
    where: { role: { not: 'PATIENT' } }
  })
  res.json({ staff })
})

export default router
