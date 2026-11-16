# Production-grade minimal Nginx Alpine container for MERA static website
FROM nginx:1.27-alpine-slim

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy website contents into nginx web root
COPY . /usr/share/nginx/html/

# Copy custom nginx virtual host configuration
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf

# Adjust permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
