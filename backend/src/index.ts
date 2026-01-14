import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Express backend!' })
})

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// Start server
app.listen(port, () => {
  console.log(`✓ Server is running on http://localhost:${port}`)
})
