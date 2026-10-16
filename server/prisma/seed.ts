import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3307,
  user: 'hms_user',
  password: 'hms_password',
  database: 'jonescare_webapp',
  connectionLimit: 5,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('password123', 10)

  const staff = [
    { name: 'System Admin',    email: 'admin@jonescare.test',     phone: '0700000001', gender: 'MALE'   as const, role: 'ADMIN'        as const },
    { name: 'Alice Reception', email: 'reception@jonescare.test', phone: '0700000002', gender: 'FEMALE' as const, role: 'RECEPTIONIST' as const },
    { name: 'Dr. Bob Mwangi',  email: 'doctor@jonescare.test',    phone: '0700000003', gender: 'MALE'   as const, role: 'DOCTOR'       as const, licenseNo: 'KMPDC-12345' },
    { name: 'Nurse Carol',     email: 'nurse@jonescare.test',     phone: '0700000004', gender: 'FEMALE' as const, role: 'NURSE'        as const, licenseNo: 'NCK-23456' },
    { name: 'Lab Tech Dan',    email: 'lab@jonescare.test',       phone: '0700000005', gender: 'MALE'   as const, role: 'LAB_TECH'     as const, licenseNo: 'KMLTTB-34567' },
    { name: 'Pharm Eve',       email: 'pharmacy@jonescare.test',  phone: '0700000006', gender: 'FEMALE' as const, role: 'PHARMACIST'   as const, licenseNo: 'PPB-45678' },
  ]

  for (const s of staff) {
    await prisma.users.upsert({
      where:  { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        role: s.role,
        license_no: s.licenseNo ?? null,
        password_hash: hash,
      },
    })
  }

  console.log('Seed complete. All staff password: password123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
