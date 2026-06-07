import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply auth and admin authorization to all admin endpoints
router.use(auth);
router.use(authorize(['admin']));

// Validation helper
const validateUserInput = (name, email, password, address, role) => {
  const errors = [];
  if (!name || name.length < 20 || name.length > 60) {
    errors.push('Name must be between 20 and 60 characters.');
  }
  if (!address || address.length > 400) {
    errors.push('Address must not exceed 400 characters.');
  }
  const pwdRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
  if (!password || !pwdRegex.test(password)) {
    errors.push('Password must be 8-16 characters and contain at least one uppercase letter and one special character.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  if (!role || !['admin', 'user', 'owner'].includes(role)) {
    errors.push('Role must be admin, user, or owner.');
  }
  return errors;
};

// @route   GET /api/admin/dashboard
// @desc    Get dashboard metrics (total users, stores, ratings)
router.get('/dashboard', async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const storesCount = await pool.query('SELECT COUNT(*) FROM stores');
    const ratingsCount = await pool.query('SELECT COUNT(*) FROM ratings');

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalStores: parseInt(storesCount.rows[0].count),
      totalRatings: parseInt(ratingsCount.rows[0].count),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/admin/users
// @desc    Add a new user (admin, user, owner)
router.post('/users', async (req, res) => {
  const { name, email, password, address, role } = req.body;

  const errors = validateUserInput(name, email, password, address, role);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  try {
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role, created_at',
      [name, email, passwordHash, address, role]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/admin/stores
// @desc    Add a new store
router.post('/stores', async (req, res) => {
  const { name, email, address, ownerId } = req.body;

  // Store name validations: min 20, max 60 (to match Name rule if applicable, or we can make it more flexible, but PDF says Name is Min 20, Max 60, let's keep it consistent)
  if (!name || name.length < 20 || name.length > 60) {
    return res.status(400).json({ message: 'Store Name must be between 20 and 60 characters.' });
  }
  if (!address || address.length > 400) {
    return res.status(400).json({ message: 'Address must not exceed 400 characters.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    // Verify store owner exists and has 'owner' role
    const ownerCheck = await pool.query('SELECT role FROM users WHERE id = $1', [ownerId]);
    if (ownerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Owner user not found.' });
    }
    if (ownerCheck.rows[0].role !== 'owner') {
      return res.status(400).json({ message: 'The specified owner does not have the "owner" role.' });
    }

    const storeExist = await pool.query('SELECT * FROM stores WHERE email = $1', [email]);
    if (storeExist.rows.length > 0) {
      return res.status(400).json({ message: 'Store already exists with this email.' });
    }

    const newStore = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, address, ownerId]
    );

    res.status(201).json(newStore.rows[0]);
  } catch (err) {
    console.error('Create store error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all normal and admin users (also including store owners for comprehensive list) with sorting & filtering
router.get('/users', async (req, res) => {
  const { search = '', role = '', sortBy = 'name', sortOrder = 'asc' } = req.query;

  // Allowed columns to sort by to prevent SQL injection
  const allowedSortCols = ['name', 'email', 'address', 'role', 'created_at'];
  const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    let queryText = `
      SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
             AVG(r.rating) as avg_rating
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE (u.name ILIKE $1 OR u.email ILIKE $1 OR u.address ILIKE $1)
    `;
    const queryParams = [`%${search}%`];

    if (role) {
      queryParams.push(role);
      queryText += ` AND u.role = $2`;
    }

    queryText += `
      GROUP BY u.id
      ORDER BY ${sortCol} ${order}
    `;

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/admin/stores
// @desc    Get all stores with average ratings, supporting search & sorting
router.get('/stores', async (req, res) => {
  const { search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;

  const allowedSortCols = ['name', 'email', 'address', 'avg_rating', 'created_at'];
  let sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // Average rating sort order needs to be handled differently since it's an alias
  if (sortCol === 'avg_rating') {
    sortCol = 'COALESCE(AVG(r.rating), 0)';
  } else {
    sortCol = `s.${sortCol}`;
  }

  try {
    const queryText = `
      SELECT s.id, s.name, s.email, s.address, s.created_at, s.owner_id,
             u.name as owner_name,
             COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
             COUNT(r.rating) as total_ratings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE (s.name ILIKE $1 OR s.email ILIKE $1 OR s.address ILIKE $1)
      GROUP BY s.id, u.name
      ORDER BY ${sortCol} ${order}
    `;

    const result = await pool.query(queryText, [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get stores error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get detailed user details (if owner, display store rating)
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];

    if (user.role === 'owner') {
      // Fetch owned stores and their ratings
      const storesResult = await pool.query(
        `SELECT s.id, s.name, s.email, s.address,
                COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = $1
         GROUP BY s.id`,
        [id]
      );
      user.stores = storesResult.rows;
    }

    res.json(user);
  } catch (err) {
    console.error('Get user details error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
