# РецептичкаБг Backend API

Backend server for the РецептичкаБг (Bulgarian and worldwide recipes) application. Built with Node.js, Express, and PostgreSQL/Supabase.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with password reset via email tokens
- **Recipe Management** - Full CRUD for recipes with image upload, approval workflow (pending/approved/rejected)
- **User Management** - Profile management with avatars, role-based permissions (user/admin/super_admin), user administration
- **Articles System** - Content management for articles with categories and multi-image paragraphs (admin only)
- **Ratings & Reviews** - User rating system for recipes with average rating calculation
- **Favorites System** - Users can save and manage their favorite recipes
- **File Upload** - Integration with Supabase Storage for recipe and article images
- **Email Service** - Password reset emails via Nodemailer

## 📁 Project Structure

```
рецептичкаБг-server/
├── controllers/          # Request handlers
│   ├── articles.js
│   ├── auth.js
│   ├── favorites.js
│   ├── recipes.js
│   └── users.js
├── dto/                  # Data validation schemas
│   ├── favorites.dto.js
│   ├── forgot-password.dto.js
│   ├── login.dto.js
│   ├── rating-recipe.dto.js
│   ├── recipe.dto.js
│   ├── reset-password.dto.js
│   ├── signup.dto.js
│   └── update-user.dto.js
├── middleware/           # Custom middleware
│   ├── authMiddleware.js
│   ├── file-upload.js
│   └── validation.middleware.js
├── migrations/           # Database migrations
├── routes/               # API routes
│   ├── articles.js
│   ├── auth.js
│   ├── favorites.js
│   ├── recipes.js
│   └── users.js
├── sql/                  # SQL queries
│   ├── articles/
│   ├── favorites/
│   └── recipes/
├── utils/                # Helper functions
│   ├── email-helper.js
│   ├── file-helpers.js
│   └── translations-errors.js
├── db.js                 # Database connection
├── index.js              # Main application entry
└── supabase.js           # Supabase client configuration
```