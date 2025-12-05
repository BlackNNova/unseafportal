# UNSEAF Portal Deployment Guide for Hostinger

## Prerequisites
- Hostinger Premium or Business plan with Python support
- Domain name configured
- SSH access (if using VPS)

## Deployment Options

### Option 1: Hostinger Web Hosting (Shared Hosting)

#### Step 1: Build the Frontend
```bash
cd frontend
npm install
npm run build
```

This will build the React app into `backend/src/static/`

#### Step 2: Upload Backend Files
1. Compress the entire `backend` folder into a ZIP file
2. Upload to your Hostinger file manager
3. Extract in the root directory of your domain

#### Step 3: Configure Python Environment
1. In Hostinger control panel, go to "Python App"
2. Create new Python app with Python 3.8+
3. Set startup file to: `wsgi.py`
4. Set application root to your backend folder
5. Install dependencies from requirements.txt

#### Step 4: Database Setup
The SQLite database will be created automatically in `backend/src/database/`

#### Step 5: Environment Configuration
Create `.env` file in backend root:
```
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-change-this
DATABASE_URL=sqlite:///src/database/app.db
```

### Option 2: Hostinger VPS

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, pip, and nginx
sudo apt install python3 python3-pip python3-venv nginx -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

#### Step 2: Upload and Setup Application
```bash
# Upload your project files to /var/www/unseaf-portal/
cd /var/www/unseaf-portal/

# Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

#### Step 3: Configure Gunicorn
```bash
pip install gunicorn

# Test gunicorn
gunicorn --bind 0.0.0.0:8000 backend.wsgi:app
```

#### Step 4: Create Systemd Service
Create `/etc/systemd/system/unseaf-portal.service`:
```ini
[Unit]
Description=UNSEAF Portal
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/unseaf-portal/backend
Environment=PATH=/var/www/unseaf-portal/venv/bin
ExecStart=/var/www/unseaf-portal/venv/bin/gunicorn --workers 3 --bind unix:unseaf-portal.sock -m 007 wsgi:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Step 5: Configure Nginx
Create `/etc/nginx/sites-available/unseaf-portal`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 20M;

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/unseaf-portal/backend/unseaf-portal.sock;
    }

    location /static/ {
        alias /var/www/unseaf-portal/backend/src/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/unseaf-portal/backend/src/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

#### Step 6: Enable and Start Services
```bash
# Enable nginx site
sudo ln -s /etc/nginx/sites-available/unseaf-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Enable and start unseaf-portal service
sudo systemctl enable unseaf-portal
sudo systemctl start unseaf-portal
sudo systemctl status unseaf-portal
```

#### Step 7: SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Post-Deployment Steps

### 1. Create Admin User
```bash
cd backend
python create_admin.py
```

### 2. Test the Application
- Visit your domain
- Test login functionality
- Test KYC uploads
- Test transfers and withdrawals

### 3. Database Backup Script
Create `backup_db.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/unseaf-portal/backend/src/database/app.db /var/www/unseaf-portal/backups/db_backup_$DATE.db
# Keep only last 7 backups
find /var/www/unseaf-portal/backups/ -name "db_backup_*.db" -mtime +7 -delete
```

### 4. Log Monitoring
Monitor application logs:
```bash
# Check application logs
sudo journalctl -u unseaf-portal -f

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## File Permissions
```bash
sudo chown -R www-data:www-data /var/www/unseaf-portal/
sudo chmod -R 755 /var/www/unseaf-portal/
sudo chmod -R 755 /var/www/unseaf-portal/backend/src/uploads/
sudo chmod 644 /var/www/unseaf-portal/backend/src/database/app.db
```

## Security Checklist

1. **Change SECRET_KEY** in production
2. **Enable HTTPS** with SSL certificate
3. **Configure firewall** (allow only 22, 80, 443)
4. **Regular backups** of database
5. **Update system** regularly
6. **Monitor logs** for suspicious activity
7. **Use strong passwords** for admin accounts

## Troubleshooting

### Common Issues:

1. **Static files not loading**: Check nginx static file configuration
2. **Database errors**: Verify file permissions on database file
3. **Upload errors**: Check upload directory permissions
4. **502 Bad Gateway**: Check if gunicorn service is running

### Debug Commands:
```bash
# Check service status
sudo systemctl status unseaf-portal

# View logs
sudo journalctl -u unseaf-portal -n 50

# Restart services
sudo systemctl restart unseaf-portal
sudo systemctl restart nginx
```

## Performance Optimization

1. **Enable gzip compression** in nginx
2. **Configure caching headers** for static assets
3. **Use CDN** for static assets if needed
4. **Monitor resource usage** with htop/btop
5. **Database optimization**: Regular VACUUM for SQLite

## Support
For deployment issues, check:
1. Application logs
2. Nginx error logs
3. System logs
4. File permissions
5. Network connectivity