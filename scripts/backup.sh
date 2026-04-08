#!/bin/bash
# XeroCode DB Auto-Backup Script
# Run via cron: 0 3 * * * /path/to/backup.sh
# Backs up PostgreSQL to local dir + optional S3 upload

set -euo pipefail

BACKUP_DIR="/var/backups/xerocode"
DB_NAME="ai_office"
DB_USER="ai_office"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

# S3 config (optional — set in .env or cron environment)
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-backups/xerocode}"

# Create backup dir
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Dump database (compressed)
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
echo "[$(date)] Backup created: $BACKUP_FILE ($((FILESIZE / 1024))KB)"

# Upload to S3 (if configured)
if [ -n "$S3_BUCKET" ]; then
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $BACKUP_FILE)"
        echo "[$(date)] Uploaded to S3: s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $BACKUP_FILE)"
    else
        echo "[$(date)] WARNING: aws CLI not found, skipping S3 upload"
    fi
fi

# Cleanup old backups (local)
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"

# Also backup uploads directory
UPLOADS_DIR="/var/www/ai-office/uploads"
if [ -d "$UPLOADS_DIR" ]; then
    UPLOADS_BACKUP="${BACKUP_DIR}/uploads_${DATE}.tar.gz"
    tar -czf "$UPLOADS_BACKUP" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)" 2>/dev/null || true
    echo "[$(date)] Uploads backup: $UPLOADS_BACKUP"

    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        aws s3 cp "$UPLOADS_BACKUP" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $UPLOADS_BACKUP)"
    fi
fi

echo "[$(date)] Backup complete!"
