# UNSEAF Portal Deployment Checklist

## 🎯 Configuration Summary
- **Frontend**: https://funding-unseaf.org
- **Backend API**: https://api.funding-unseaf.org/api
- **CORS**: Configured for cross-domain communication

## 📋 Backend Deployment Steps

### 1. Install New Dependencies
On your API server (`https://api.funding-unseaf.org`):
```bash
pip install python-dotenv==1.0.0
```

### 2. Upload Updated Files
Upload these files to your API server:
- `backend/src/main.py` (updated with CORS & environment config)
- `backend/.env` (production environment variables)
- `backend/requirements.txt` (includes python-dotenv)

### 3. Environment Configuration
Ensure your production `.env` file contains:
```env
FLASK_ENV=production
SECRET_KEY=your-super-secure-secret-key-change-this
ALLOWED_ORIGINS=https://funding-unseaf.org,https://www.funding-unseaf.org
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=None
MAX_CONTENT_LENGTH=16777216
```

### 4. Restart API Server
Restart your Flask application to apply the new configuration.

## 🌐 Frontend Deployment Steps

### 1. Build for Production
In your frontend directory:
```bash
npm run build
```
This creates a `dist/` folder with production-ready files.

### 2. Environment Variables Check
Your production build will use:
- `VITE_API_BASE_URL=https://api.funding-unseaf.org` (from .env.production)

### 3. Deploy to https://funding-unseaf.org
Upload the contents of the `frontend/dist/` folder to your web server.

## ✅ Testing Checklist

After deployment, test these endpoints:

### Frontend Tests:
- [ ] Homepage loads at https://funding-unseaf.org
- [ ] Login page accessible
- [ ] Register page accessible
- [ ] Static assets (images, CSS) load correctly

### API Tests:
- [ ] Test CORS: Browser console should not show CORS errors
- [ ] Login functionality works
- [ ] Registration functionality works
- [ ] Dashboard loads after login
- [ ] File uploads work (KYC documents)

### Cross-Domain Authentication:
- [ ] Login persists across page refreshes
- [ ] Sessions work correctly between frontend and API
- [ ] Logout works properly

## 🚨 Common Issues & Solutions

### CORS Errors:
- Ensure ALLOWED_ORIGINS in `.env` exactly matches your frontend domain
- Check that your API server has the updated `main.py`
- Verify python-dotenv is installed

### Session Issues:
- Ensure your API is served over HTTPS
- Check SESSION_COOKIE_SECURE=true is set
- Verify SESSION_COOKIE_SAMESITE=None

### Build Issues:
- Run `npm run build` in the frontend directory
- Check that `VITE_API_BASE_URL` is correctly set in `.env.production`

## 🔒 Security Notes

### Production Security:
1. **Change SECRET_KEY**: Use a cryptographically secure random string
2. **HTTPS Only**: Both frontend and API must use HTTPS
3. **Secure Cookies**: SESSION_COOKIE_SECURE=true ensures cookies only sent over HTTPS
4. **CORS Restriction**: Only your domain is allowed to make API requests

### Recommended SECRET_KEY Generation:
```python
import secrets
print(secrets.token_hex(32))
```

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check API server logs
3. Verify all environment variables are set correctly
4. Test API endpoints directly using curl or Postman
