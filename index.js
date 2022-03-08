const express = require('express');
const cors = require('cors')
require("dotenv").config();
const app = express();
const { Client } = require('pg')

app.use(cors())
app.use(express.json())

const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

db.connect()

app.get('/', async (req, res) => {
    const results = await db.query('SELECT * FROM history ORDER BY updated_at DESC')
    if (!results || results.rowCount < 1) {
        res.json({err: 'Problem adding recent search to database'})
    } else {
        res.json(results.rows)
    }   
})

app.post('/', async (req, res) => {
    const { location_id, location, country, lat, lon } = req.body

    const found = await db.query('SELECT * FROM history WHERE location_id = $1', [location_id])

    if (!found || found.rows.length === 0) {
        const results = await db.query('INSERT INTO history (location_id, location, country, lat, lon) VALUES ($1, $2, $3, $4, $5) RETURNING history_id, location_id, location, country, lat, lon', [location_id, location, country, lat, lon])
            if (!results || results.rowCount < 1) {
                res.json({err: 'Problem adding recent search to database'})
            } else {
                res.json(results.rows[0])
            }    
    } else {
        const modifyUpdatedAt = await db.query('UPDATE history SET updated_at = now() WHERE history_id = $1', [found.rows[0].history_id]) 
        if (!modifyUpdatedAt || modifyUpdatedAt.rowCount < 1) {
            res.json({err: 'Problem updating recent search to database'})
        } else {
            res.json(found.rows[0])
        }
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});