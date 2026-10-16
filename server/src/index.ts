import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jones-care-hms' })
})

const port = Number(process.env.PORT) || 4000

app.listen(port, '0.0.0.0', () => {
  console.log('API listening on http://localhost:' + port)
})
