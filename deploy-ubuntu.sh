#!/bin/bash

# OpenWorld3js Deployment Script for Ubuntu
# This script deploys Laravel backend, Node.js socket server, and React frontend with Nginx

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
PROJECT_DIR="/var/www/openworld3js"
DOMAIN="your-domain.com"  # Change this to your domain
DB_NAME="openworld3js"
DB_USER="openworld3js"
DB_PASSWORD=$(openssl rand -base64 32)  # Generate random password
SOCKET_PORT="3000"
PHP_VERSION="8.2"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Get script directory and validate project structure
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

print_message "============================================"
print_message "OpenWorld3js Deployment Script"
print_message "============================================"
echo ""
print_message "Configuration:"
echo "  - Domain: ${DOMAIN}"
echo "  - Project Directory: ${PROJECT_DIR}"
echo "  - Database: ${DB_NAME}"
echo "  - Socket Port: ${SOCKET_PORT}"
echo "  - PHP Version: ${PHP_VERSION}"
echo ""

# Validate project structure
print_message "Validating project structure..."
if [ ! -d "${SCRIPT_DIR}/backend-php" ]; then
    print_error "backend-php directory not found in ${SCRIPT_DIR}"
    print_error "Please run this script from the project root directory"
    exit 1
fi

if [ ! -d "${SCRIPT_DIR}/backend-socket" ]; then
    print_error "backend-socket directory not found in ${SCRIPT_DIR}"
    print_error "Please run this script from the project root directory"
    exit 1
fi

if [ ! -d "${SCRIPT_DIR}/frontend" ]; then
    print_error "frontend directory not found in ${SCRIPT_DIR}"
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if this is an update or fresh install
if [ -f "${PROJECT_DIR}/.first_deployment_complete" ]; then
    print_warning "Existing deployment detected - this will UPDATE the application"
    echo "Press Ctrl+C within 5 seconds to cancel..."
    sleep 5
fi

print_message "Starting deployment process..."

# Update system
print_message "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install necessary software properties
print_message "Installing software-properties-common..."
apt-get install -y software-properties-common curl wget git unzip rsync

# Add PHP repository
print_message "Adding PHP repository..."
add-apt-repository -y ppa:ondrej/php
apt-get update

# Install PHP and extensions
print_message "Installing PHP ${PHP_VERSION} and extensions..."
apt-get install -y \
    php${PHP_VERSION} \
    php${PHP_VERSION}-cli \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-tokenizer \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-intl

# Install Composer
print_message "Installing Composer..."
if [ ! -f /usr/local/bin/composer ]; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# Install MariaDB
print_message "Installing MariaDB..."
apt-get install -y mariadb-server mariadb-client

# Start and enable MariaDB
systemctl start mariadb
systemctl enable mariadb

# Secure MariaDB installation (automated) - only on first run
if [ ! -f "${PROJECT_DIR}/.db_initialized" ]; then
    print_message "Securing MariaDB installation..."
    mysql -e "DELETE FROM mysql.user WHERE User='';" 2>/dev/null || true
    mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" 2>/dev/null || true
    mysql -e "DROP DATABASE IF EXISTS test;" 2>/dev/null || true
    mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;"
fi

# Create database and user (idempotent)
print_message "Setting up database and user..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Check if user exists, if not create it
USER_EXISTS=$(mysql -sse "SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = '${DB_USER}' AND host = 'localhost')")
if [ "$USER_EXISTS" = "0" ]; then
    print_message "Creating database user..."
    mysql -e "CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    # Save password for first time
    echo "${DB_PASSWORD}" > ${PROJECT_DIR}/.db_password
    chmod 600 ${PROJECT_DIR}/.db_password
else
    print_message "Database user already exists, using existing credentials..."
    if [ -f "${PROJECT_DIR}/.db_password" ]; then
        DB_PASSWORD=$(cat ${PROJECT_DIR}/.db_password)
    else
        print_warning "Database user exists but password file not found. Using new password..."
        mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
        echo "${DB_PASSWORD}" > ${PROJECT_DIR}/.db_password
        chmod 600 ${PROJECT_DIR}/.db_password
    fi
fi

mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Mark database as initialized
touch ${PROJECT_DIR}/.db_initialized

# Install Node.js and npm
print_message "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Nginx
print_message "Installing Nginx..."
apt-get install -y nginx

# Create project directory
print_message "Setting up project directory..."
mkdir -p ${PROJECT_DIR}

# Copy project files
print_message "Copying project files from ${SCRIPT_DIR}..."

# Stop services before updating files
if systemctl is-active --quiet openworld3js-socket; then
    print_message "Stopping socket server for update..."
    systemctl stop openworld3js-socket
fi

# Backup existing .env files before copying
if [ -f "${PROJECT_DIR}/backend-php/.env" ]; then
    print_message "Backing up existing Laravel .env file..."
    cp ${PROJECT_DIR}/backend-php/.env ${PROJECT_DIR}/backend-php/.env.backup
fi

if [ -f "${PROJECT_DIR}/backend-socket/.env" ]; then
    print_message "Backing up existing socket server .env file..."
    cp ${PROJECT_DIR}/backend-socket/.env ${PROJECT_DIR}/backend-socket/.env.backup
fi

# Copy backend-php
print_message "Copying Laravel backend..."
rsync -av --quiet --exclude='.env' --exclude='storage/logs' --exclude='storage/framework' --exclude='bootstrap/cache' --exclude='vendor' --exclude='node_modules' ${SCRIPT_DIR}/backend-php/ ${PROJECT_DIR}/backend-php/

# Copy backend-socket
print_message "Copying Node.js socket server..."
rsync -av --quiet --exclude='.env' --exclude='node_modules' ${SCRIPT_DIR}/backend-socket/ ${PROJECT_DIR}/backend-socket/

# Copy frontend
print_message "Copying frontend..."
rsync -av --quiet --exclude='node_modules' --exclude='dist' ${SCRIPT_DIR}/frontend/ ${PROJECT_DIR}/frontend/

# Restore .env files if they were backed up
if [ -f "${PROJECT_DIR}/backend-php/.env.backup" ]; then
    print_message "Restoring Laravel .env file..."
    cp ${PROJECT_DIR}/backend-php/.env.backup ${PROJECT_DIR}/backend-php/.env
fi

if [ -f "${PROJECT_DIR}/backend-socket/.env.backup" ]; then
    print_message "Restoring socket server .env file..."
    cp ${PROJECT_DIR}/backend-socket/.env.backup ${PROJECT_DIR}/backend-socket/.env
fi

# Setup Laravel backend
print_message "Setting up Laravel backend..."
cd ${PROJECT_DIR}/backend-php

# Create necessary directories
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Install Laravel dependencies
print_message "Installing Laravel dependencies..."
composer install --no-dev --optimize-autoloader

# Create .env file only if it doesn't exist
if [ ! -f .env ]; then
    print_message "Creating Laravel .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        touch .env
    fi
    
    # Configure Laravel .env for first time
    print_message "Configuring Laravel environment..."
    cat > .env << EOL
APP_NAME="OpenWorld3js"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://${DOMAIN}

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

SANCTUM_STATEFUL_DOMAINS=${DOMAIN}

SOCKET_SERVER_URL=http://${DOMAIN}:${SOCKET_PORT}
EOL
    
    # Generate Laravel key for new installation
    print_message "Generating Laravel application key..."
    php artisan key:generate --force
else
    print_message "Using existing Laravel .env file..."
fi

# Run migrations (safe to run multiple times)
print_message "Running database migrations..."
php artisan migrate --force

# Clear old cache before optimizing
print_message "Clearing Laravel cache..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Optimize Laravel
print_message "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
print_message "Setting Laravel permissions..."
chown -R www-data:www-data ${PROJECT_DIR}/backend-php
chmod -R 755 ${PROJECT_DIR}/backend-php
chmod -R 775 ${PROJECT_DIR}/backend-php/storage
chmod -R 775 ${PROJECT_DIR}/backend-php/bootstrap/cache

# Setup Node.js socket server
print_message "Setting up Node.js socket server..."
cd ${PROJECT_DIR}/backend-socket

# Install Node.js dependencies
print_message "Installing Node.js dependencies..."
npm install --production

# Create .env file for socket server only if it doesn't exist
if [ ! -f .env ]; then
    print_message "Creating socket server .env file..."
    cat > .env << EOL
NODE_ENV=production
PORT=${SOCKET_PORT}
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://${DOMAIN}
EOL
else
    print_message "Using existing socket server .env file..."
fi

# Create or update systemd service for socket server
print_message "Setting up systemd service for socket server..."
cat > /etc/systemd/system/openworld3js-socket.service << EOL
[Unit]
Description=OpenWorld3js Socket Server
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=${PROJECT_DIR}/backend-socket
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=openworld3js-socket
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Reload, enable and restart socket server
systemctl daemon-reload
systemctl enable openworld3js-socket

# Restart the service (works for both new and existing services)
if systemctl is-active --quiet openworld3js-socket; then
    print_message "Restarting socket server..."
    systemctl restart openworld3js-socket
else
    print_message "Starting socket server..."
    systemctl start openworld3js-socket
fi

# Build frontend
print_message "Building frontend..."
cd ${PROJECT_DIR}/frontend

# Install frontend dependencies
print_message "Installing frontend dependencies..."
npm install

# Build frontend
print_message "Building frontend for production..."
npm run build

# Create directory for built frontend
mkdir -p ${PROJECT_DIR}/public
cp -r dist/* ${PROJECT_DIR}/public/

# Configure Nginx
print_message "Configuring Nginx..."
cat > /etc/nginx/sites-available/openworld3js << EOL
# Socket.IO Server
server {
    listen ${SOCKET_PORT};
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:${SOCKET_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}

# Main application server
server {
    listen 80;
    server_name ${DOMAIN};
    root ${PROJECT_DIR}/public;

    index index.html index.htm index.php;

    charset utf-8;

    # Frontend static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Laravel API endpoints
    location /api {
        alias ${PROJECT_DIR}/backend-php/public;
        try_files \$uri \$uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
            fastcgi_param SCRIPT_FILENAME ${PROJECT_DIR}/backend-php/public/index.php;
            include fastcgi_params;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/\$1 last;
    }

    # Deny access to .htaccess files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Additional security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/openworld3js-access.log;
    error_log /var/log/nginx/openworld3js-error.log;
}
EOL

# Enable site
ln -sf /etc/nginx/sites-available/openworld3js /etc/nginx/sites-enabled/

# Remove default site only if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    print_message "Removing default Nginx site..."
    rm -f /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
print_message "Testing Nginx configuration..."
if nginx -t; then
    print_message "Nginx configuration is valid"
    # Restart or reload Nginx
    if systemctl is-active --quiet nginx; then
        print_message "Reloading Nginx..."
        systemctl reload nginx
    else
        print_message "Starting Nginx..."
        systemctl start nginx
    fi
    systemctl enable nginx
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    print_message "Configuring firewall..."
    ufw allow 'Nginx Full'
    ufw allow ${SOCKET_PORT}/tcp
    ufw --force enable
fi

# Create log rotation
print_message "Setting up log rotation..."
cat > /etc/logrotate.d/openworld3js << EOL
${PROJECT_DIR}/backend-php/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
EOL

# Save/Update deployment information
print_message "Updating deployment information..."

# If file exists, back it up
if [ -f ${PROJECT_DIR}/DEPLOYMENT_INFO.txt ]; then
    cp ${PROJECT_DIR}/DEPLOYMENT_INFO.txt ${PROJECT_DIR}/DEPLOYMENT_INFO.txt.backup
fi

cat > ${PROJECT_DIR}/DEPLOYMENT_INFO.txt << EOL
OpenWorld3js Deployment Information
====================================
Last Deployment: $(date)

Database Information:
- Database Name: ${DB_NAME}
- Database User: ${DB_USER}
- Database Password: ${DB_PASSWORD}

Application URLs:
- Main Application: http://${DOMAIN}
- Socket Server: http://${DOMAIN}:${SOCKET_PORT}

Paths:
- Project Directory: ${PROJECT_DIR}
- Laravel Backend: ${PROJECT_DIR}/backend-php
- Socket Server: ${PROJECT_DIR}/backend-socket
- Frontend: ${PROJECT_DIR}/public

Services:
- Socket Server Service: openworld3js-socket
  - Start: systemctl start openworld3js-socket
  - Stop: systemctl stop openworld3js-socket
  - Restart: systemctl restart openworld3js-socket
  - Status: systemctl status openworld3js-socket
  - Logs: journalctl -u openworld3js-socket -f

Log Files:
- Nginx Access: /var/log/nginx/openworld3js-access.log
- Nginx Error: /var/log/nginx/openworld3js-error.log
- Laravel: ${PROJECT_DIR}/backend-php/storage/logs/laravel.log
- Socket Server: journalctl -u openworld3js-socket

Useful Commands:
- Redeploy/Update: sudo ${SCRIPT_DIR}/deploy-ubuntu.sh
- View Laravel logs: tail -f ${PROJECT_DIR}/backend-php/storage/logs/laravel.log
- View Socket logs: journalctl -u openworld3js-socket -f --since "1 hour ago"
- Test Nginx config: nginx -t
- Reload Nginx: systemctl reload nginx

Important Notes:
1. This script can be run multiple times safely for updates
2. .env files are preserved during updates
3. Consider setting up SSL with Let's Encrypt (certbot)
4. Review and update firewall rules as needed
5. Setup automated database backups

Next Steps (if first deployment):
1. Setup SSL (highly recommended):
   apt-get install certbot python3-certbot-nginx
   certbot --nginx -d ${DOMAIN}

2. Setup database backups:
   mkdir -p /backup
   Add to crontab: 0 2 * * * mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} | gzip > /backup/openworld3js_\$(date +\%Y\%m\%d).sql.gz

3. Setup log monitoring:
   Consider installing logwatch or similar monitoring tools
EOL

chmod 600 ${PROJECT_DIR}/DEPLOYMENT_INFO.txt

# Final status check
print_message "Checking service status..."
systemctl status openworld3js-socket --no-pager || true
systemctl status nginx --no-pager || true
systemctl status php${PHP_VERSION}-fpm --no-pager || true
systemctl status mariadb --no-pager || true

# Print completion message
echo ""
print_message "============================================"
print_message "Deployment completed successfully!"
print_message "============================================"
echo ""
print_message "Your application should now be accessible at:"
print_message "  - Frontend: http://${DOMAIN}"
print_message "  - Socket Server: http://${DOMAIN}:${SOCKET_PORT}"
echo ""
print_message "Deployment information: ${PROJECT_DIR}/DEPLOYMENT_INFO.txt"
echo ""

# Check if this is first deployment
if [ ! -f "${PROJECT_DIR}/.first_deployment_complete" ]; then
    print_warning "FIRST DEPLOYMENT DETECTED!"
    print_warning "Please review the following:"
    echo "  1. Setup SSL with Let's Encrypt (certbot)"
    echo "  2. Configure automated database backups"
    echo "  3. Review security settings"
    echo "  4. Test the application thoroughly"
    echo ""
    touch ${PROJECT_DIR}/.first_deployment_complete
else
    print_message "This was an update/redeployment."
    print_message "All services have been restarted with the latest code."
    echo ""
fi

print_message "Useful commands:"
echo "  - View logs: journalctl -u openworld3js-socket -f"
echo "  - Restart socket: systemctl restart openworld3js-socket"
echo "  - Reload Nginx: systemctl reload nginx"
echo "  - Laravel logs: tail -f ${PROJECT_DIR}/backend-php/storage/logs/laravel.log"
echo ""
print_message "To redeploy/update, simply run this script again!"
echo ""