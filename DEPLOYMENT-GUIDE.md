# 🚀 Hướng dẫn Deploy lên Cloud

## 🔧 **Các vấn đề đã sửa:**

### **1. Rate Limiting (429 Too Many Requests)**

- ✅ Tăng limit từ 5 → 50 requests/15 phút
- ✅ Skip rate limiting trong development
- ✅ Thêm retry logic cho 429 errors

### **2. CORS Configuration**

- ✅ Cấu hình CORS linh hoạt cho production
- ✅ Thêm logging cho blocked origins
- ✅ Hỗ trợ multiple domains

### **3. Token Refresh**

- ✅ Thêm timeout cho refresh requests
- ✅ Cải thiện error handling
- ✅ Thêm debug logs

## 📋 **Environment Variables cần thiết:**

```bash
# Production
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret
PORT=3001
```

## 🌐 **CORS Settings:**

Backend đã được cấu hình để accept:

- `https://qlhv.vercel.app`
- `https://fe-student-manager.vercel.app`
- `http://localhost:3000` (development)

## 🔄 **Rate Limiting:**

- **Development**: No limits
- **Production**: 500 requests/15 phút cho refresh token

## 🚀 **Deploy Steps:**

### **1. Backend (Render.com)**

```bash
# 1. Connect GitHub repo
# 2. Set environment variables
# 3. Deploy automatically
```

### **2. Frontend (Vercel)**

```bash
# 1. Connect GitHub repo
# 2. Set environment variables
# 3. Update BASE_URL to production backend
```

## 🐛 **Troubleshooting:**

### **401 Unauthorized**

- Kiểm tra JWT_SECRET có đúng không
- Kiểm tra token expiration time
- Kiểm tra CORS settings

### **429 Too Many Requests**

- Rate limiting đã được tăng lên 50/15 phút
- Có retry logic tự động
- Check logs để xem request frequency

### **CORS Errors**

- Kiểm tra domain trong allowedOrigins
- Kiểm tra credentials: true
- Kiểm tra preflight requests

## 📊 **Monitoring:**

### **Backend Logs:**

```bash
# Check for CORS blocked origins
# Check rate limiting hits
# Check token refresh attempts
```

### **Frontend Console:**

```bash
# Check for 401/429 errors
# Check token refresh logs
# Check CORS errors
```

## ✅ **Testing:**

### **1. Test Authentication:**

```javascript
// Test login
POST / user / login;
// Test refresh
POST / user / refresh - token;
// Test protected route
GET / user / me;
```

### **2. Test CORS:**

```javascript
// Check if cookies are sent
// Check if credentials are included
// Check preflight requests
```

## 🎯 **Production Checklist:**

- [ ] Environment variables set
- [ ] Database connected
- [ ] CORS configured
- [ ] Rate limiting appropriate
- [ ] SSL certificates valid
- [ ] Domain names correct
- [ ] Error handling working
- [ ] Logging enabled
