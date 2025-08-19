
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { body, query, validationResult } = require('express-validator');
const { pool, init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'school-api', time: new Date().toISOString() });
});

// POST /addSchool
app.post(
  '/addSchool',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('address').trim().isLength({ min: 1 }).withMessage('address is required'),
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('latitude must be a number between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('longitude must be a number between -180 and 180'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, latitude, longitude } = req.body;

    try {
      const [result] = await pool.execute(
        `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`,
        [name, address, latitude, longitude]
      );
      res.status(201).json({
        message: 'School added successfully',
        school: {
          id: result.insertId,
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
      });
    } catch (err) {
      console.error('Insert error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /listSchools?lat=..&lng=.. OR ?latitude=..&longitude=..
app.get('/listSchools', async (req, res) => {
  // Accept both styles
  const userLat = parseFloat(req.query.lat || req.query.latitude);
  const userLng = parseFloat(req.query.lng || req.query.longitude);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({
      errors: [
        { msg: 'latitude (lat) and longitude (lng) are required and must be valid numbers' }
      ]
    });
  }

  // Haversine formula in SQL (distance in KM; Earth radius ≈ 6371 km)
  const sql = `
    SELECT
      id, name, address, latitude, longitude,
      (6371 * ACOS(
        COS(RADIANS(?)) * COS(RADIANS(latitude)) *
        COS(RADIANS(longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(latitude))
      )) AS distance_km
    FROM schools
    ORDER BY distance_km ASC
  `;

  try {
    const [rows] = await pool.execute(sql, [userLat, userLng, userLat]);
    res.json({
      count: rows.length,
      user_location: { lat: userLat, lng: userLng },
      schools: rows.map(r => ({
        id: r.id,
        name: r.name,
        address: r.address,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        distance_km: r.distance_km !== null ? Number(r.distance_km.toFixed(3)) : null,
      })),
    });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await init();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
