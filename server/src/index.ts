
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import adminRoutes from './routes/admin'
import authRoutes from './routes/auth'
import coreRoutes from './routes/core'
const app = express()

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jones-care-hms' })
})
app.use('/api/core', coreRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/patients', require('./routes/patients').default)  
const port = Number(process.env.PORT) || 4000
app.listen(port, '0.0.0.0', () => console.log('API listening on http://localhost:' + port))