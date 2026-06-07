import express from 'express';
import pool from '../db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply auth and owner authorization to all owner endpoints
router.use(auth);
router.use(authorize(['owner']));

// @route   GET /api/owner/dashboard
// @desc    Get store owner's stores and ratings submitted by users
router.get('/dashboard', async (req, res) => {
  const ownerId = req.user.id;

  try {
    // Get all stores owned by this user
    const storesResult = await pool.query(
      `SELECT s.id, s.name, s.email, s.address,
              COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
              COUNT(r.rating) as total_ratings
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = $1
       GROUP BY s.id`,
      [ownerId]
    );

    // Get list of all users who submitted ratings for these stores
    const ratingsResult = await pool.query(
      `SELECT r.id as rating_id, r.rating, r.created_at,
              u.name as user_name, u.email as user_email, u.address as user_address,
              s.name as store_name, s.id as store_id
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN stores s ON r.store_id = s.id
       WHERE s.owner_id = $1
       ORDER BY r.created_at DESC`,
      [ownerId]
    );

    res.json({
      stores: storesResult.rows,
      ratings: ratingsResult.rows,
    });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
