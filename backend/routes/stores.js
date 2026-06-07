import express from 'express';
import pool from '../db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// All store endpoints require user authentication
router.use(auth);

// @route   GET /api/stores
// @desc    Get all stores with average rating and current user's rating, supporting search & sorting
router.get('/', async (req, res) => {
  const { search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
  const userId = req.user.id;

  const allowedSortCols = ['name', 'address', 'avg_rating', 'user_rating'];
  let sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  if (sortCol === 'avg_rating') {
    sortCol = 'COALESCE(AVG(r.rating), 0)';
  } else if (sortCol === 'user_rating') {
    sortCol = '(SELECT rating FROM ratings WHERE store_id = s.id AND user_id = $2)';
  } else {
    sortCol = `s.${sortCol}`;
  }

  try {
    const queryText = `
      SELECT s.id, s.name, s.address, s.email,
             COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
             (SELECT rating FROM ratings WHERE store_id = s.id AND user_id = $2) as user_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE (s.name ILIKE $1 OR s.address ILIKE $1)
      GROUP BY s.id
      ORDER BY ${sortCol} ${order}
    `;

    const result = await pool.query(queryText, [`%${search}%`, userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get stores error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/ratings
// @desc    Submit or update a rating for a store
router.post('/rate', async (req, res) => {
  const { storeId, rating } = req.body;
  const userId = req.user.id;

  if (!storeId || rating === undefined) {
    return res.status(400).json({ message: 'Please provide both storeId and rating.' });
  }

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    // Check if store exists
    const storeCheck = await pool.query('SELECT * FROM stores WHERE id = $1', [storeId]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Insert or update rating
    const queryText = `
      INSERT INTO ratings (user_id, store_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, store_id)
      DO UPDATE SET rating = EXCLUDED.rating
      RETURNING *
    `;

    const result = await pool.query(queryText, [userId, storeId, ratingVal]);
    res.json({
      message: 'Rating saved successfully',
      rating: result.rows[0],
    });
  } catch (err) {
    console.error('Save rating error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
