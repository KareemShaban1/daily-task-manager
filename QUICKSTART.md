# Quick Start Guide

Get your Daily Task Manager up and running in 5 minutes!

## Prerequisites Check

- ✅ Node.js 18+ installed (`node --version`)
- ✅ MySQL 8.0+ installed and running
- ✅ npm or yarn installed

## Step 1: Database Setup

1. **Create the database:**
```bash
mysql -u root -p
```

Then in MySQL:
```sql
CREATE DATABASE daily_task_manager;
EXIT;
```

2. **Run the schema:**
```bash
cd backend
mysql -u root -p daily_task_manager < src/database/schema.sql
```

## Step 2: Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
# Copy the example (or create manually)
# Update with your MySQL credentials
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=daily_task_manager
JWT_SECRET=change_this_to_a_random_string
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@dailytaskmanager.com
FRONTEND_URL=http://localhost:5173
DEFAULT_TIMEZONE=UTC
```

**Note:** For Gmail, you'll need to:
- Enable 2-factor authentication
- Generate an "App Password" in your Google Account settings
- Use that app password in `SMTP_PASSWORD`

4. **Seed categories:**
```bash
npm run seed
```

5. **Start the backend:**
```bash
npm run dev
```

You should see:
```
✅ Database connection established
🚀 Server running on port 3001
```

## Step 3: Frontend Setup

1. **Open a new terminal and navigate to project root:**
```bash
cd ..  # Back to project root
```

2. **Install dependencies (if not already done):**
```bash
npm install
```

3. **Create `.env` file in root:**
```env
VITE_API_URL=http://localhost:3001/api
```

4. **Start the frontend:**
```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 4: Test the Application

1. **Open your browser:**
   - Go to `http://localhost:5173`

2. **Sign up:**
   - Click "Sign up"
   - Enter your email and password
   - Fill in your name
   - Submit

3. **Create your first task:**
   - After signing up, you'll be redirected to the dashboard
   - Click "New Task"
   - Example: Create "Fajr Prayer" task
   - Set reminder time (e.g., 05:00)
   - Select category: Spiritual
   - Save

4. **Complete a task:**
   - On the dashboard, check the checkbox next to a task
   - Watch your streak counter!

## Troubleshooting

### Database Connection Error

**Error:** `Database connection failed`

**Solution:**
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**
- Change `PORT` in backend `.env` to another port (e.g., 3002)
- Update `VITE_API_URL` in frontend `.env` accordingly

### Email Not Sending

**Error:** Email notifications not working

**Solution:**
- Verify Gmail app password is correct
- Check SMTP settings in `.env`
- Check backend logs for email errors
- Note: Email is optional - app works without it

### CORS Error

**Error:** `CORS policy blocked`

**Solution:**
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default should be `http://localhost:5173`

## Next Steps

1. **Create more tasks** - Add your daily routines
2. **Set reminders** - Configure multiple reminder times
3. **Track streaks** - Complete tasks daily to build streaks
4. **Check statistics** - View your completion rates

## Production Deployment

For production deployment, see the main `README.md` for detailed instructions.

## Need Help?

- Check the main `README.md` for detailed documentation
- Review `ARCHITECTURE.md` for system design
- Check backend logs for errors
- Verify all environment variables are set

---

Happy task managing! 🎉


