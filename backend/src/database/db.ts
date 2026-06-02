import { Pool } from 'pg'

// const pool = new Pool({
//     host: process.env.RDS_HOST,
//     port: parseInt(process.env.RDS_PORT || '5432'),
//     database: process.env.RDS_NAME,
//     user: process.env.RDS_USER,
//     password: process.env.RDS_PASSWORD
// })

const pool = new Pool({
  connectionString: process.env.NEON_DB,
//   ssl: {
//     rejectUnauthorized: false
//   }
})

export default pool