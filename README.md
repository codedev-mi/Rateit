# ⭐ Rateit - Store Rating & Review Platform

Rateit is a full-stack web application that allows users to search, view, and rate registered stores. It features a complete role-based system supporting **Administrators**, **Store Owners**, and **Standard Users**.

---

## 🚀 Key Features

- **Role-Based Dashboards**: Customized user interfaces and route protection for Admin, Store Owner, and Standard User roles.
- **Secure Authentication**: Secure JWT-based session management and password hashing with `bcryptjs`.
- **Store Ratings**: Interactive rating system (1 to 5 stars) with restrictions (one review per user per store).
- **Admin Management**: Full CRUD capabilities for managing stores, owners, and users.
- **Store Owner Operations**: View all reviews and ratings specific to their stores.
- **Robust Input Validation**: Multi-layer validations on both frontend and backend (e.g., password complexity, name lengths).

---

## 🛠️ Technology Stack

### Frontend
- **React 19** with **Vite**
- **React Router DOM v7** (Routing and route guards)
- **Context API** (Global state management for Auth)
- **Lucide React** (Modern, sleek SVG icon set)
- **Vanilla CSS** (Custom, modern dashboard styling with dark mode elements)

### Backend
- **Node.js** & **Express**
- **PostgreSQL** (Relational Database)
- **pg (node-postgres)** (Database pool client)
- **jsonwebtoken (JWT)** (Secure token auth)
- **bcryptjs** (Secure hashing algorithm)

---

## 📦 Project Structure

```text
Rateit/
├── backend/                # Express API Backend
│   ├── middleware/        # Authentication & Role guards
│   ├── routes/            # Auth, Admin, Owner, & Store API endpoints
│   ├── db.js              # PostgreSQL Connection pool
│   └── server.js          # App entry point
├── frontend/               # React Web App
│   ├── src/
│   │   ├── components/    # Reusable components (e.g., Navbar)
│   │   ├── context/       # AuthContext for state preservation
│   │   ├── pages/         # Pages (Login, Register, User/Owner/Admin dashboards)
│   │   └── index.css      # Core Design system & layouts
│   └── package.json       # Frontend dependencies
├── db_data/                # Local database cluster files (excluded in git)
├── schema.sql              # Database migrations and initial seed data
└── README.md               # Documentation
```

---

## 🔧 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v13+)

### 1. Database Setup
1. Launch your PostgreSQL server on port `5433` (or adjust the port configuration in `.env`).
2. Run the `schema.sql` file in your PostgreSQL instance to create the database schema and default tables:
   ```bash
   psql -h localhost -p 5433 -U postgres -f schema.sql
   ```

### 2. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   PORT=5000
   DATABASE_URL=postgres://postgres@127.0.0.1:5433/store_rating_db
   JWT_SECRET=super_secret_token_123_abc_xyz
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development web server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Default Credentials

### Administrator Account
- **Email:** `admin@example.com`
- **Password:** `Admin@123`

### Standard User Registration Rules
To sign up as a new user, navigate to the `/register` page. Note the validation constraints:
- **Name:** Must be between `20` and `60` characters.
- **Address:** Maximum `400` characters.
- **Password:** Between `8` and `16` characters containing at least **one uppercase letter** and **one special character** (e.g., `User@1234`).