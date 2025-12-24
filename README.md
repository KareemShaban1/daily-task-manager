# Daily Life Task Manager - SaaS Application

A comprehensive SaaS web application for managing daily life tasks with features like daily repeating tasks, custom reminders, real-time notifications, streak tracking, and more.

## 🚀 Features

### Core Features
- ✅ **Daily Repeating Tasks** - Create tasks that repeat every day (e.g., 5 Islamic prayers)
- ✅ **Custom Reminder Times** - Set multiple reminder times per task
- ✅ **Real-time Notifications** - In-app notifications + scheduled email reminders (Gmail supported)
- ✅ **Task Completion Tracking** - Daily streaks & completion history
- ✅ **User Authentication** - Signup, login, password reset with email verification
- ✅ **Timezone-aware Reminders** - All reminders respect user's timezone

### Extra Features
- 📊 **Daily Statistics & Streaks** - Track completion rates and maintain streaks
- 🔔 **Missed-task Alerts** - Get notified when you miss a task
- 📁 **Task Categories** - Organize tasks by Spiritual, Health, Personal, Habits
- 👤 **Admin Dashboard** - Admin panel for user management (structure ready)
- 💳 **Subscription-ready** - Built-in structure for future monetization

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui components
- React Router for routing
- TanStack Query for data fetching
- React Hook Form + Zod for form validation

**Backend:**
- Node.js with Express
- TypeScript
- MySQL database
- JWT authentication
- Nodemailer for email (SMTP)
- node-cron for scheduled tasks
- Luxon for timezone handling

### Project Structure

```
daily-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/      # Route controllers
│   │   ├── database/         # DB connection & schema
│   │   ├── middleware/       # Auth middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic (notifications, cron)
│   │   ├── utils/            # Utilities (email, JWT, password, timezone)
│   │   └── server.ts         # Express server
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/           # React components
│   ├── contexts/             # React contexts (Auth)
│   ├── lib/                  # API client
│   ├── pages/                # Page components
│   └── App.tsx
└── package.json
```

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Gmail account (for email notifications) or SMTP server

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=daily_task_manager

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@dailytaskmanager.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Timezone
DEFAULT_TIMEZONE=UTC
```

4. Create MySQL database:
```sql
CREATE DATABASE daily_task_manager;
```

5. Run database schema:
```bash
mysql -u root -p daily_task_manager < src/database/schema.sql
```

6. Seed categories:
```bash
npm run seed
```

7. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
VITE_API_URL=http://localhost:3001/api
```

3. Start development server:
```bash
npm run dev
```

## 📊 Database Schema

The application uses MySQL with the following main tables:

- **users** - User accounts and authentication
- **tasks** - Daily tasks with reminders
- **task_categories** - Task categorization (Spiritual, Health, Personal, Habits)
- **task_completions** - Daily completion tracking
- **task_streaks** - Streak calculations
- **notifications** - In-app notifications
- **scheduled_reminders** - Reminder scheduling for cron jobs
- **daily_statistics** - Aggregated daily stats
- **user_settings** - User preferences
- **admin_users** - Admin access control

See `backend/src/database/schema.sql` for complete schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify?token=...` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile (protected)

### Tasks
- `GET /api/tasks` - Get all tasks (protected)
- `GET /api/tasks/:id` - Get task details (protected)
- `POST /api/tasks` - Create task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)
- `POST /api/tasks/:id/complete` - Mark task complete (protected)
- `POST /api/tasks/:id/uncomplete` - Uncomplete task (protected)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category details

### Statistics
- `GET /api/statistics/daily?date=...` - Get daily statistics (protected)
- `GET /api/statistics/weekly?startDate=...&endDate=...` - Get weekly stats (protected)
- `GET /api/statistics/history?taskId=...` - Get completion history (protected)

### Notifications
- `GET /api/notifications` - Get notifications (protected)
- `GET /api/notifications/unread-count` - Get unread count (protected)
- `PUT /api/notifications/:id/read` - Mark as read (protected)
- `PUT /api/notifications/read-all` - Mark all as read (protected)
- `DELETE /api/notifications/:id` - Delete notification (protected)

## 🔔 Notification System

The application includes a comprehensive notification system:

1. **Scheduled Reminders** - Cron job runs every minute to check for due reminders
2. **Missed Task Alerts** - Daily check at 9 AM for missed tasks from previous day
3. **In-app Notifications** - Stored in database and displayed in UI
4. **Email Notifications** - Sent via SMTP (Gmail supported)

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS configuration
- SQL injection protection (parameterized queries)
- Email verification
- Password reset tokens with expiration

## 🚀 Deployment

### Backend Deployment

1. Build the TypeScript code:
```bash
cd backend
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

### Frontend Deployment

1. Build for production:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

### Database Migration

For production, run the schema SQL file against your MySQL database.

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DB_*` - MySQL connection details
- `JWT_SECRET` - Secret for JWT tokens
- `SMTP_*` - Email configuration
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

## 🧪 Testing

To test the application:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Visit `http://localhost:5173`
4. Sign up for a new account
5. Create a daily task with reminders
6. Complete tasks to build streaks

## 📈 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Social features (share streaks)
- [ ] Advanced analytics dashboard
- [ ] Task templates
- [ ] Recurring patterns (weekly, monthly)
- [ ] Integration with calendar apps
- [ ] Multi-language support

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@dailytaskmanager.com or open an issue on GitHub.

---

Built with ❤️ for better daily habits and task management.
