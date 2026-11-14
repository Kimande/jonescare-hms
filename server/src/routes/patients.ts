import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/roles'

const router = Router()

// Only Receptionists and Admins can register patients
router.use(requireAuth, requireRole('ADMIN', 'RECEPTIONIST'))

const PatientSchema = z.object({
  name: z.string().min(2),
  dob: z.string(), // YYYY-MM-DD
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(10),
  county: z.string().optional(),
  town: z.string().optional(),
  shaNumber: z.string().optional(),
})

router.post('/', async (req, res) => {
  const parsed = PatientSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Please check the data entered.' })

  const { name, dob, gender, phone, county, town, shaNumber } = parsed.data

  try {
    // 1. Check if phone number already exists (Prevent duplicates)
    const existing = await prisma.patients.findFirst({ where: { phone } })
    if (existing) {
      return res.status(400).json({ error: 'A patient with this phone number already exists.' })
    }

    // 2. Generate the next Patient Number safely
    const lastPatient = await prisma.patients.findFirst({
      orderBy: { id: 'desc' },
    })

    let nextNo = 1
    if (lastPatient && lastPatient.patient_no.startsWith('P-')) {
      nextNo = parseInt(lastPatient.patient_no.split('-')[1]) + 1
    }
    const patientNo = 'P-' + String(nextNo).padStart(4, '0')

    // 3. Save
    const patient = await prisma.patients.create({
      data: {
        patient_no: patientNo,
        name,
        dob: new Date(dob),
        gender,
        phone,
        county: county || null,
        town: town || null,
        sha_number: shaNumber || null,
      },
    })

    res.status(201).json({ patient })
  } catch (error) {
    console.error('Patient registration failed:', error)
    res.status(500).json({ error: 'System error: Could not save patient. Please try again.' })
  }
})

export default router
