import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'
import { Router } from 'express'
import PDFDocument from 'pdfkit'
import { PrismaClient } from '../generated/prisma/client'

const router = Router()

const adapter = new PrismaMariaDb({
  host: 'localhost', port: 3307, user: 'hms_user', password: 'hms_password', database: 'jonescare_webapp', connectionLimit: 5,
})
const prisma = new PrismaClient({ adapter })

// Helper: Get start of current week
function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

router.get('/stats', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekStart = getStartOfWeek();

    const patientsToday = await prisma.patient.count({ where: { createdAt: { gte: today } } })
    const staffOnDuty = await prisma.user.count({ where: { status: 'ACTIVE' } })
    const pendingLabs = await prisma.labRequest.count({ where: { status: 'PENDING' } })
    
    const payments = await prisma.payment.aggregate({ where: { createdAt: { gte: today } }, _sum: { amount: true } })
    const revenueToday = Number(payments._sum.amount || 0);

    // AUTO-GENERATE CHARTS
    const weeklyPayments = await prisma.payment.findMany({ where: { createdAt: { gte: weekStart } } });
    const revenueChart = [0,0,0,0,0,0,0];
    weeklyPayments.forEach(p => {
      const dayIndex = Math.floor((p.createdAt.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) revenueChart[dayIndex] += Number(p.amount);
    });

    const visitsThisWeek = await prisma.visit.findMany({ where: { createdAt: { gte: weekStart } } });
    const trafficChart = [0,0,0,0,0,0,0];
    visitsThisWeek.forEach(v => {
      const dayIndex = Math.floor((v.createdAt.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) trafficChart[dayIndex]++;
    });

    const diagnosed = await prisma.visit.findMany({ where: { diagnosis: { not: null }, status: 'COMPLETED' } });
    const diagnosisCounts: any = {};
    diagnosed.forEach(v => { diagnosisCounts[v.diagnosis!] = (diagnosisCounts[v.diagnosis!] || 0) + 1; });
    const diagnosesChart = Object.keys(diagnosisCounts).map(k => ({ name: k, value: diagnosisCounts[k] }));

    // AUTO-GENERATE AI INSIGHTS (Zero hardcoded text)
    let aiInsight = "System is actively monitoring. No specific trends detected yet.";
    if (revenueToday === 0) aiInsight = "⚠️ No revenue recorded today. Please ensure reception is processing payments.";
    else if (pendingLabs > 5) aiInsight = `⚠️ You have ${pendingLabs} pending lab tests. Lab technicians may need assistance.`;
    else if (diagnosesChart.length > 0) {
      const topDisease = diagnosesChart.sort((a: any, b: any) => b.value - a.value)[0];
      aiInsight = `✅ The most common diagnosis is currently ${topDisease.name}. Consider ensuring treatment stock is sufficient.`;
    }

    res.json({
      patientsToday, revenueToday, staffOnDuty, pendingLabs, 
      revenueChart, trafficChart, diagnosesChart, aiInsight
    })
  } catch (error) { res.status(500).json({ error: 'Stats failed' }) }
})

// Get All Staff
router.get('/staff', async (req, res) => {
  const staff = await prisma.user.findMany({ 
    where: { role: { not: 'PATIENT' } }, 
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, phone: true, licenseNo: true, status: true }
  })
  res.json(staff)
})

// Create Staff
router.post('/staff', async (req, res) => {
  const { name, email, phone, role, licenseNo, gender } = req.body
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already exists' })

    const passwordHash = await bcrypt.hash('password123', 10)
    await prisma.user.create({ data: { name, email, phone, role, licenseNo: licenseNo || null, gender, passwordHash } })
    res.status(201).json({ success: true })
  } catch (error) { res.status(500).json({ error: 'Failed to create staff' }) }
})

// PDF Generator (Auto-calculates everything based on DB)
router.get('/report/pdf', async (req, res) => {
  const weekStart = getStartOfWeek();
  const today = new Date();

  const visits = await prisma.visit.findMany({ where: { createdAt: { gte: weekStart } }, include: { patient: true } });
  const payments = await prisma.payment.findMany({ where: { createdAt: { gte: weekStart } } });
  const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename=JonesCare_Weekly_Analysis.pdf')
  doc.pipe(res)
  
  doc.fontSize(22).fillColor('#0a0f24').text('Jones Care Hospital', { align: 'center' })
  doc.fontSize(14).fillColor('#555').text('Weekly System Analysis Report', { align: 'center' })
  doc.moveDown().fontSize(10).fillColor('#000').text(`Report Period: ${weekStart.toLocaleDateString()} to ${today.toLocaleDateString()}`)
  doc.moveDown(2)
  
  doc.fontSize(14).font('Helvetica-Bold').text('1. Key Metrics')
  doc.font('Helvetica').fontSize(12).text(`Total Patients Served: ${visits.length}`).text(`Total Revenue Collected: KES ${revenue.toLocaleString()}`)
  doc.moveDown().font('Helvetica-Bold').text('2. Automated System Analysis')
  doc.font('Helvetica').text(`This week, the system processed ${visits.length} patient visits. Total revenue stands at KES ${revenue.toLocaleString()}.`)
  doc.moveDown().font('Helvetica-Bold').text('3. Patient Activity Log')
  doc.font('Helvetica')
  visits.forEach(v => doc.text(`- ${v.patient.name} (${v.patient.patientNo}) : ${v.diagnosis || v.status}`))
  doc.end()
})

export default router