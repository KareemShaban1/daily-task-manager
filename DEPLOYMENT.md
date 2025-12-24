# Deployment Guide - Contabo VPS

This guide will help you deploy the Daily Life Task Manager application on a Contabo VPS server.

## 📋 Prerequisites

- Contabo VPS with Ubuntu 20.04/22.04 LTS
- Root or sudo access
- Domain name (optional but recommended for SSL)
- SSH access to your server

## 🚀 Step 1: Initial Server Setup

### 1.1 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Essential Tools

```bash
sudo apt install -y curl wget git build-essential
```

## 🔧 Step 2: Install Node.js (v18+)

### Option A: Using NodeSource Repository (Recommended)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Option B: Using NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
npm --version
```

## 🗄️ Step 3: Install MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify MySQL is running
sudo systemctl status mysql
```

### 3.1 Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p

# Run these SQL commands:
```

```sql
-- Create database
CREATE DATABASE daily_task_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'taskmanager_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON daily_task_manager.* TO 'taskmanager_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

## 🌐 Step 4: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## 📦 Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the instructions shown in the output
```

## 📥 Step 6: Deploy Application

### 6.1 Clone Repository

```bash
# Navigate to home directory or create app directory
cd ~
mkdir -p /var/www
cd /var/www

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/daily-task-manager.git
cd daily-task-manager

# Or upload files via SCP/SFTP and extract
```

### 6.2 Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### 6.3 Create Backend Environment File

```bash
# Create .env file
nano .env
```

Add the following configuration (adjust values as needed):

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=taskmanager_user
DB_PASSWORD=your_strong_password_here
DB_NAME=daily_task_manager

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Frontend URL (update with your domain)
FRONTEND_URL=https://yourdomain.com

# Timezone
DEFAULT_TIMEZONE=UTC

# Rate Limiting (optional, set to true to disable in production)
DISABLE_RATE_LIMIT=false
```

**Important Notes:**
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- Update FRONTEND_URL with your actual domain

### 6.4 Initialize Database

```bash
# Run database schema
mysql -u taskmanager_user -p daily_task_manager < src/database/schema.sql

# Run migrations if any
mysql -u taskmanager_user -p daily_task_manager < src/database/migrations/add_task_due_date.sql
```

### 6.5 Setup Frontend

```bash
# Navigate to project root
cd /var/www/daily-task-manager

# Install dependencies
npm install

# Create frontend .env file
nano .env
```

Add frontend environment variables:

```env
VITE_API_URL=https://yourdomain.com/api
```

**Or if using subdomain:**

```env
VITE_API_URL=https://api.yourdomain.com
```

### 6.6 Build Frontend

```bash
# Build for production
npm run build

# The build output will be in the 'dist' directory
```

## 🚀 Step 7: Start Backend with PM2

```bash
# Navigate to backend directory
cd /var/www/daily-task-manager/backend

# Start the application with PM2
pm2 start dist/server.js --name daily-task-manager-api

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs daily-task-manager-api
```

### PM2 Useful Commands

```bash
# View logs
pm2 logs daily-task-manager-api

# Restart application
pm2 restart daily-task-manager-api

# Stop application
pm2 stop daily-task-manager-api

# Monitor
pm2 monit
```

## 🔒 Step 8: Configure Nginx Reverse Proxy

### 8.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/daily-task-manager
```

Add the following configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # Or use yourdomain.com/api

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/daily-task-manager/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Alternative: Single Domain Setup**

If you want to use a single domain:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/daily-task-manager/dist;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.2 Enable Site and Test Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/daily-task-manager /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔐 Step 9: Setup SSL with Let's Encrypt

### 9.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtain SSL Certificate

```bash
# For single domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For subdomain setup
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 9.3 Auto-Renewal Setup

Certbot automatically sets up auto-renewal. Test it:

```bash
# Test renewal
sudo certbot renew --dry-run
```

## 🔥 Step 10: Configure Firewall

```bash
# Install UFW if not already installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## ✅ Step 11: Verify Deployment

1. **Check Backend API:**
   ```bash
   curl http://localhost:3001/api/health
   # Or visit: https://yourdomain.com/api/health
   ```

2. **Check Frontend:**
   - Visit `https://yourdomain.com` in your browser
   - Should see the login page

3. **Check PM2:**
   ```bash
   pm2 status
   pm2 logs daily-task-manager-api --lines 50
   ```

4. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   ```

5. **Check MySQL:**
   ```bash
   sudo systemctl status mysql
   ```

## 🔄 Step 12: Update Application

When you need to update the application:

```bash
# Navigate to project directory
cd /var/www/daily-task-manager

# Pull latest changes (if using git)
git pull origin main

# Update backend
cd backend
npm install
npm run build
pm2 restart daily-task-manager-api

# Update frontend
cd ..
npm install
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

## 📊 Step 13: Monitoring and Maintenance

### 13.1 PM2 Monitoring

```bash
# View real-time monitoring
pm2 monit

# View logs
pm2 logs daily-task-manager-api

# View process info
pm2 info daily-task-manager-api
```

### 13.2 System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
# Or use: htop (install with: sudo apt install htop)
```

### 13.3 Log Files

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PM2 logs
pm2 logs daily-task-manager-api
```

## 🛠️ Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs daily-task-manager-api

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Restart PM2
pm2 restart daily-task-manager-api
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u taskmanager_user -p daily_task_manager

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## 🔐 Security Best Practices

1. **Keep System Updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Strong Passwords:**
   - Database password
   - JWT secret
   - SMTP password

3. **Regular Backups:**
   ```bash
   # Backup database
   mysqldump -u taskmanager_user -p daily_task_manager > backup_$(date +%Y%m%d).sql
   ```

4. **Monitor Logs Regularly:**
   ```bash
   pm2 logs daily-task-manager-api
   sudo tail -f /var/log/nginx/access.log
   ```

5. **Set Up Fail2Ban (Optional):**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

## 📝 Environment Variables Summary

### Backend (.env)
- `PORT=3001`
- `NODE_ENV=production`
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=taskmanager_user`
- `DB_PASSWORD=your_password`
- `DB_NAME=daily_task_manager`
- `JWT_SECRET=your_secret`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your_email@gmail.com`
- `SMTP_PASSWORD=your_app_password`
- `FRONTEND_URL=https://yourdomain.com`

### Frontend (.env)
- `VITE_API_URL=https://yourdomain.com/api`

## 🎯 Quick Reference Commands

```bash
# Restart backend
pm2 restart daily-task-manager-api

# View backend logs
pm2 logs daily-task-manager-api

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql

# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql

# Update application
cd /var/www/daily-task-manager
git pull
cd backend && npm install && npm run build && pm2 restart daily-task-manager-api
cd .. && npm install && npm run build
sudo systemctl reload nginx
```

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`
2. Verify all services are running
3. Check firewall rules
4. Verify DNS settings point to your server IP
5. Ensure all environment variables are set correctly

---

**Note:** Replace `yourdomain.com` with your actual domain name throughout this guide.

