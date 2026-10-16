import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as dotenv from 'dotenv'
import { PrismaClient } from '../generated/prisma/client'

dotenv.config()

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3307,
  user: 'hms_user',
  password: 'hms_password',
  database: 'jonescare_webapp',
  connectionLimit: 5,
})

export const prisma = new PrismaClient({ adapter })
