import bcrypt from 'bcrypt'
import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

const parseVitals = (value: unknown) => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value
}

const mapPatient = (patient: any) => ({
  ...patient,
  patientNo: patient.patient_no,
  shaNumber: patient.sha_number,
})

const mapVisit = (visit: any) => ({
  ...visit,
  patient: visit.patients ? mapPatient(visit.patients) : null,
  patientId: visit.patient_id,
  vitals: parseVitals(visit.vitals),
})

const mapLabRequest = (request: any) => ({
  ...request,
  testName: request.test_name,
  visit: request.visits ? mapVisit(request.visits) : null,
  visitId: request.visit_id,
})

const mapPrescription = (script: any) => ({
  ...script,
  drug: script.drugs ? { ...script.drugs, stockQty: script.drugs.stock_qty, reorderLevel: script.drugs.reorder_level } : null,
  visit: script.visits ? mapVisit(script.visits) : null,
  drugId: script.drug_id,
  visitId: script.visit_id,
})

router.get('/admin/stats', async (_req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [patientsToday, staffOnDuty, pendingLabs, revenueResult] = await Promise.all([
      prisma.patients.count({ where: { created_at: { gte: today } } }),
      prisma.users.count({ where: { status: 'ACTIVE' } }),
      prisma.lab_requests.count({ where: { status: 'PENDING' } }),
      prisma.payments.aggregate({
        where: { created_at: { gte: today } },
        _sum: { amount: true },
      }),
    ])

    res.json({
      patientsToday,
      revenueToday: revenueResult._sum.amount ? Number(revenueResult._sum.amount.toString()) : 0,
      staffOnDuty,
      pendingLabs,
      revenueChart: [60, 85, 110, 140, 160, 200, 230],
      trafficChart: [60, 120, 80, 180, 170, 110, 130],
      diagnosesChart: [
        { name: 'Malaria', value: 40 },
        { name: 'Flu', value: 25 },
        { name: 'Typhoid', value: 20 },
        { name: 'Others', value: 15 },
      ],
    })
  } catch (error) {
    console.error('Admin stats failed:', error)
    res.status(500).json({ error: 'Stats failed' })
  }
})

router.get('/admin/report/pdf', async (_req, res) => {
  const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 57 >>\nstream\nBT\n/F1 12 Tf\n50 70 Td\n(Jones Care Hospital Report) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000123 00000 n \n0000000245 00000 n \n0000000812 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n875\n%%EOF'

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename=JonesCare_Report.pdf')
  res.send(Buffer.from(content, 'binary'))
})

router.get('/patients', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim()

    const patients = await prisma.patients.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
              { patient_no: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { created_at: 'desc' },
      take: 20,
    })

    res.json({ patients: patients.map(mapPatient) })
  } catch (error) {
    console.error('Patient fetch failed:', error)
    res.status(500).json({ error: 'Could not load patients.' })
  }
})

router.post('/patients', async (req, res) => {
  try {
    const { name, dob, gender, phone, county, town, shaNumber } = req.body

    const lastPatient = await prisma.patients.findFirst({ orderBy: { id: 'desc' } })
    let nextNo = 1
    if (lastPatient && lastPatient.patient_no.startsWith('P-')) {
      nextNo = Number.parseInt(lastPatient.patient_no.split('-')[1], 10) + 1
    }

    const patient = await prisma.patients.create({
      data: {
        patient_no: 'P-' + String(nextNo).padStart(4, '0'),
        name,
        dob: new Date(dob),
        gender,
        phone,
        county: county || null,
        town: town || null,
        sha_number: shaNumber || null,
      },
    })

    res.status(201).json({ patient: mapPatient(patient) })
  } catch (error) {
    console.error('Patient creation failed:', error)
    res.status(500).json({ error: 'System error: Could not save patient. Please try again.' })
  }
})

router.post('/visits', async (req, res) => {
  try {
    const { patientId } = req.body
    const visit = await prisma.visits.create({
      data: {
        patient_id: Number(patientId),
        status: 'WAITING',
      },
      include: { patients: true },
    })

    res.status(201).json(mapVisit(visit))
  } catch (error) {
    console.error('Visit creation failed:', error)
    res.status(500).json({ error: 'Could not create visit.' })
  }
})

router.get('/visits/waiting', async (_req, res) => {
  try {
    const visits = await prisma.visits.findMany({
      where: { status: 'WAITING' },
      include: { patients: true },
      orderBy: { created_at: 'desc' },
    })

    res.json(visits.map(mapVisit))
  } catch (error) {
    console.error('Waiting visits failed:', error)
    res.status(500).json({ error: 'Could not fetch waiting visits.' })
  }
})

router.put('/visits/:id/vitals', async (req, res) => {
  try {
    const { temp, bp, weight } = req.body
    await prisma.visits.update({
      where: { id: Number(req.params.id) },
      data: {
        vitals: JSON.stringify({ temp, bp, weight }),
        status: 'IN_CONSULTATION',
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Vitals update failed:', error)
    res.status(500).json({ error: 'Could not update vitals.' })
  }
})

router.get('/visits/doctor', async (_req, res) => {
  try {
    const visits = await prisma.visits.findMany({
      where: { status: 'IN_CONSULTATION' },
      include: { patients: true, lab_requests: true },
      orderBy: { created_at: 'desc' },
    })

    res.json(visits.map(mapVisit))
  } catch (error) {
    console.error('Doctor queue failed:', error)
    res.status(500).json({ error: 'Could not fetch consultation queue.' })
  }
})

router.put('/visits/:id/complete', async (req, res) => {
  try {
    const { diagnosis, notes } = req.body
    await prisma.visits.update({
      where: { id: Number(req.params.id) },
      data: {
        diagnosis,
        notes,
        status: 'COMPLETED',
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Consultation complete failed:', error)
    res.status(500).json({ error: 'Could not complete consultation.' })
  }
})

router.post('/visits/:id/lab', async (req, res) => {
  try {
    const { testName } = req.body
    await prisma.lab_requests.create({
      data: {
        visit_id: Number(req.params.id),
        test_name: testName,
        status: 'PENDING',
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Lab order failed:', error)
    res.status(500).json({ error: 'Could not order lab test.' })
  }
})

router.post('/visits/:id/prescribe', async (req, res) => {
  try {
    const { drugName, dosage, quantity } = req.body

    let drug = await prisma.drugs.findFirst({ where: { name: drugName } })
    if (!drug) {
      drug = await prisma.drugs.create({
        data: {
          name: drugName,
          price: 10,
          stock_qty: 100,
          reorder_level: 10,
        },
      })
    }

    await prisma.prescriptions.create({
      data: {
        visit_id: Number(req.params.id),
        drug_id: drug.id,
        dosage,
        quantity: Number(quantity),
        status: 'PENDING',
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Prescription failed:', error)
    res.status(500).json({ error: 'Could not create prescription.' })
  }
})

router.get('/lab', async (_req, res) => {
  try {
    const requests = await prisma.lab_requests.findMany({
      where: { status: 'PENDING' },
      include: { visits: { include: { patients: true } } },
      orderBy: { created_at: 'desc' },
    })

    res.json(requests.map(mapLabRequest))
  } catch (error) {
    console.error('Lab queue failed:', error)
    res.status(500).json({ error: 'Could not fetch lab requests.' })
  }
})

router.put('/lab/:id', async (req, res) => {
  try {
    await prisma.lab_requests.update({
      where: { id: Number(req.params.id) },
      data: {
        result: req.body.result,
        status: 'COMPLETED',
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Lab result update failed:', error)
    res.status(500).json({ error: 'Could not update lab result.' })
  }
})

router.get('/pharmacy', async (_req, res) => {
  try {
    const [scripts, inventory] = await Promise.all([
      prisma.prescriptions.findMany({
        where: { status: 'PENDING' },
        include: { drugs: true, visits: { include: { patients: true } } },
        orderBy: { created_at: 'desc' },
      }),
      prisma.drugs.findMany({ orderBy: { name: 'asc' } }),
    ])

    res.json({
      scripts: scripts.map(mapPrescription),
      inventory: inventory.map((item) => ({
        ...item,
        stockQty: item.stock_qty,
        reorderLevel: item.reorder_level,
      })),
    })
  } catch (error) {
    console.error('Pharmacy fetch failed:', error)
    res.status(500).json({ error: 'Could not fetch pharmacy data.' })
  }
})

router.put('/pharmacy/:id/dispense', async (req, res) => {
  try {
    const script = await prisma.prescriptions.findUnique({
      where: { id: Number(req.params.id) },
      include: { drugs: true },
    })

    if (!script) {
      return res.status(404).json({ error: 'Not found' })
    }

    await prisma.$transaction([
      prisma.prescriptions.update({
        where: { id: script.id },
        data: { status: 'DISPENSED' },
      }),
      prisma.drugs.update({
        where: { id: script.drug_id },
        data: { stock_qty: { decrement: script.quantity } },
      }),
    ])

    res.json({ success: true })
  } catch (error) {
    console.error('Dispense failed:', error)
    res.status(500).json({ error: 'Could not dispense medication.' })
  }
})

router.get('/admin/staff', async (_req, res) => {
  try {
    const staff = await prisma.users.findMany({
      where: { role: { not: 'PATIENT' } },
      orderBy: { created_at: 'desc' },
    })

    res.json(staff)
  } catch (error) {
    console.error('Staff fetch failed:', error)
    res.status(500).json({ error: 'Could not load staff.' })
  }
})

router.post('/admin/staff', async (req, res) => {
  try {
    const { name, email, phone, role, licenseNo, gender } = req.body
    const hash = await bcrypt.hash('password123', 10)

    await prisma.users.create({
      data: {
        name,
        email,
        phone,
        role,
        license_no: licenseNo || null,
        gender,
        password_hash: hash,
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Staff creation failed:', error)
    res.status(500).json({ error: 'Could not create staff member.' })
  }
})

export default router