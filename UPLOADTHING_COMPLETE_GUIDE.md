# 📚 UploadThing Complete Setup Guide

Hướng dẫn đầy đủ để setup UploadThing cho dự án Express.js (Backend) + React/Next.js (Frontend).

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Cấu hình File Types](#cấu-hình-file-types)
5. [Authentication](#authentication)
6. [CORS Configuration](#cors-configuration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

UploadThing là dịch vụ cloud storage cho phép upload file trực tiếp từ frontend lên cloud mà không cần qua backend. Backend chỉ cần xác thực và nhận URL của file đã upload.

**Flow:**
1. Frontend upload file → UploadThing cloud
2. UploadThing trả về URL
3. Frontend gửi URL lên backend
4. Backend lưu URL vào database

---

## 🔧 Backend Setup

### Bước 1: Cài đặt package

```bash
cd your-backend-folder
npm install uploadthing
```

### Bước 2: Tạo FileRouter

Tạo file `src/uploadthing.js`:

```javascript
require("dotenv").config();

const { createUploadthing } = require("uploadthing/express");
const { UploadThingError } = require("uploadthing/server");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./configs"); // Hoặc process.env.JWT_SECRET

const f = createUploadthing();

/**
 * FileRouter cho ứng dụng
 * @see https://docs.uploadthing.com/file-routes
 */
const uploadRouter = {
  /**
   * FileRoute cho grade files (kết quả học tập)
   * Chấp nhận: PDF, JPG, PNG
   * Max size: 10MB
   */
  gradeFiles: f({
    pdf: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
    image: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Xác thực user trước khi upload
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        throw new UploadThingError("Unauthorized");
      }

      try {
        const token = authHeader.replace("Bearer ", "");
        const jwtKey = JWT_SECRET || process.env.JWT_SECRET;

        if (!jwtKey) {
          throw new UploadThingError("Server configuration error");
        }

        const decoded = jwt.verify(token, jwtKey);

        return {
          userId: decoded.id,
          userRole: decoded.role,
          timestamp: Date.now(),
        };
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          throw new UploadThingError("Token đã hết hạn");
        }
        if (error instanceof UploadThingError) {
          throw error;
        }
        throw new UploadThingError("Invalid token");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Code này chạy sau khi upload thành công
      // Có thể log, lưu vào database, gửi notification, etc.
      
      return {
        fileUrl: file.url,
        fileName: file.name,
        fileKey: file.key,
      };
    }),
};

module.exports = { uploadRouter };
```

### Bước 3: Mount route handler

Trong `src/index.js` (hoặc file main của Express app):

```javascript
const express = require("express");
const { createRouteHandler } = require("uploadthing/express");
const { uploadRouter } = require("./uploadthing");

const app = express();

// ... other middleware ...

// Mount UploadThing route handler
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
  })
);

// ... other routes ...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Bước 4: Cấu hình Environment Variables

Thêm vào file `.env`:

```env
UPLOADTHING_TOKEN=your_uploadthing_token_here
JWT_SECRET=your_jwt_secret_here
```

Lấy token từ: [UploadThing Dashboard](https://uploadthing.com/dashboard) → API Keys

---

## 🎨 Frontend Setup

### Bước 1: Cài đặt package

```bash
cd your-frontend-folder
npm install @uploadthing/react
```

### Bước 2: Tạo UploadThing utilities

Tạo file `src/utils/uploadthing.js`:

```javascript
"use client";

import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import { BASE_URL } from "@/configs"; // Hoặc process.env.NEXT_PUBLIC_BASE_URL

/**
 * Lấy access token từ localStorage (hoặc nơi bạn lưu token)
 */
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("accessToken") || "";
    } catch (error) {
      return "";
    }
  }
  return "";
};

/**
 * UploadThing components
 * Sử dụng với endpoint từ backend Express
 */
export const UploadButton = generateUploadButton({
  url: `${BASE_URL}/api/uploadthing`,
});

export const UploadDropzone = generateUploadDropzone({
  url: `${BASE_URL}/api/uploadthing`,
});
```

### Bước 3: Tạo constants (optional nhưng recommended)

Tạo file `src/constants/fileUpload.js`:

```javascript
/**
 * File upload constants
 */
export const FILE_UPLOAD_CONFIG = {
  // Accepted file types
  ACCEPTED_TYPES: {
    "application/pdf": [".pdf"],
    "image/*": [".jpg", ".jpeg", ".png"],
  },
  // Max file size
  MAX_SIZE: "10MB",
  // Supported file extensions for display
  SUPPORTED_EXTENSIONS: "PDF, JPG, PNG",
};
```

### Bước 4: Sử dụng trong component

```javascript
"use client";

import { useState } from "react";
import { UploadButton, getAuthToken } from "@/utils/uploadthing";
import { FILE_UPLOAD_CONFIG } from "@/constants/fileUpload";

const MyComponent = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleUploadComplete = (res) => {
    if (res?.[0]) {
      const file = res[0];
      setUploadedFileUrl(file.url);
      setUploadedFileName(file.name);
      setUploadingFile(false);
      // Show success notification
    }
  };

  const handleUploadError = (error) => {
    setUploadingFile(false);
    // Show error notification
  };

  const handleUploadBegin = (name) => {
    setUploadingFile(true);
  };

  return (
    <div>
      <UploadButton
        endpoint="gradeFiles"
        headers={{
          Authorization: `Bearer ${getAuthToken()}`,
        }}
        accept={FILE_UPLOAD_CONFIG.ACCEPTED_TYPES}
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={handleUploadBegin}
      />
      
      {uploadedFileUrl && (
        <div>
          <span>Đã upload: {uploadedFileName}</span>
        </div>
      )}
      
      {uploadingFile && <span>Đang upload...</span>}
    </div>
  );
};
```

### Bước 5: Lưu vào database

Khi submit form, gửi cả `url` và `name`:

```javascript
const payload = {
  // ... other data ...
  attachmentFile: JSON.stringify({
    url: uploadedFileUrl,
    name: uploadedFileName,
  }),
};

await axiosInstance.post("/api/endpoint", payload);
```

---

## 📁 Cấu hình File Types

### Backend (`src/uploadthing.js`)

```javascript
gradeFiles: f({
  pdf: {
    maxFileSize: "10MB",
    maxFileCount: 1,
  },
  image: {
    maxFileSize: "10MB",
    maxFileCount: 1,
  },
  // Thêm các loại file khác nếu cần:
  // video: { maxFileSize: "50MB", maxFileCount: 1 },
  // audio: { maxFileSize: "20MB", maxFileCount: 1 },
})
```

### Frontend (`src/utils/uploadthing.js` hoặc component)

```javascript
accept={{
  "application/pdf": [".pdf"],
  "image/*": [".jpg", ".jpeg", ".png"],
  // Thêm các loại khác nếu cần
}}
```

**Lưu ý:** File types trong backend và frontend phải khớp nhau!

---

## 🔐 Authentication

### Backend Middleware

UploadThing middleware nhận `req` object, bạn có thể:

1. **JWT Token từ Authorization header:**
```javascript
.middleware(async ({ req }) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UploadThingError("Unauthorized");
  }
  
  const token = authHeader.replace("Bearer ", "");
  const decoded = jwt.verify(token, JWT_SECRET);
  
  return {
    userId: decoded.id,
    userRole: decoded.role,
  };
})
```

2. **Session/Cookie:**
```javascript
.middleware(async ({ req }) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    throw new UploadThingError("Unauthorized");
  }
  
  // Verify session...
  return { userId: user.id };
})
```

### Frontend Headers

```javascript
<UploadButton
  endpoint="gradeFiles"
  headers={{
    Authorization: `Bearer ${getAuthToken()}`,
    // Hoặc cookie sẽ tự động được gửi nếu withCredentials: true
  }}
/>
```

---

## 🌐 CORS Configuration

### Backend (`src/index.js`)

**QUAN TRỌNG:** Phải thêm các headers của UploadThing vào CORS config:

```javascript
const corsOptions = {
  origin: ["http://localhost:3000", "https://yourdomain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    // UploadThing headers
    "x-uploadthing-package",
    "x-uploadthing-version",
    "x-uploadthing-file-name",
    "x-uploadthing-file-size",
    "x-uploadthing-file-type",
    // Tracing headers
    "traceparent",
    "b3",
  ],
};

app.use(cors(corsOptions));
```

**Lưu ý:** Nếu thiếu các headers này, sẽ gặp lỗi CORS!

---

## 💾 Lưu trữ trong Database

### Option 1: Lưu JSON object (Recommended)

```javascript
// Frontend
const payload = {
  attachmentFile: JSON.stringify({
    url: uploadedFileUrl,
    name: uploadedFileName,
  }),
};

// Backend - lưu vào database
attachmentFile: attachmentFile || null, // Lưu JSON string
```

### Option 2: Lưu riêng 2 fields

Nếu database có 2 fields riêng:
```javascript
attachmentFileUrl: uploadedFileUrl,
attachmentFileName: uploadedFileName,
```

### Option 3: Chỉ lưu URL (không recommended)

```javascript
attachmentFile: uploadedFileUrl, // Chỉ lưu URL
// Tên file sẽ phải parse từ URL (không đáng tin cậy)
```

---

## 🎨 Hiển thị File trong UI

Tạo component `FileAttachmentButtons.jsx`:

```javascript
"use client";

import { BASE_URL } from "@/configs";

const FileAttachmentButtons = ({ fileName }) => {
  if (!fileName) return null;

  let fileUrl, displayFileName;

  // Parse JSON nếu là JSON string (format mới)
  try {
    const fileData = JSON.parse(fileName);
    if (fileData?.url && fileData?.name) {
      fileUrl = fileData.url;
      displayFileName = fileData.name;
    } else {
      throw new Error("Invalid JSON");
    }
  } catch {
    // Format cũ: URL hoặc tên file
    const isUploadThingUrl =
      fileName.startsWith("http://") || fileName.startsWith("https://");

    if (isUploadThingUrl) {
      fileUrl = fileName;
      try {
        const url = new URL(fileName);
        const fileNameParam = url.searchParams.get("x-ut-file-name");
        displayFileName = fileNameParam
          ? decodeURIComponent(fileNameParam)
          : "File đính kèm";
      } catch {
        displayFileName = "File đính kèm";
      }
    } else {
      // Backward compatibility: file local cũ
      fileUrl = `${BASE_URL}/grade/file/${encodeURIComponent(fileName)}`;
      displayFileName = fileName;
    }
  }

  const downloadUrl = fileUrl.includes("?")
    ? `${fileUrl}&download=true`
    : `${fileUrl}?download=true`;

  return (
    <div className="flex items-center gap-3">
      <span>{displayFileName}</span>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Xem file
      </a>
      <a
        href={downloadUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Tải về
      </a>
    </div>
  );
};

export default FileAttachmentButtons;
```

---

## ✅ Best Practices

### 1. Error Handling

```javascript
onUploadError={(error) => {
  setUploadingFile(false);
  // Show user-friendly error message
  handleNotify("error", "Upload failed", error.message);
}}
```

### 2. Loading States

```javascript
const [uploadingFile, setUploadingFile] = useState(false);

onUploadBegin={() => {
  setUploadingFile(true);
}}

onClientUploadComplete={() => {
  setUploadingFile(false);
}}
```

### 3. File Validation

UploadThing tự động validate file types và size theo config trong FileRouter. Không cần validate thêm ở frontend, nhưng có thể thêm để UX tốt hơn:

```javascript
const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  
  if (!allowedTypes.includes(file.type)) {
    return "Loại file không được hỗ trợ";
  }
  if (file.size > maxSize) {
    return "File quá lớn (tối đa 10MB)";
  }
  return null;
};
```

### 4. Helper Function để tái sử dụng

```javascript
const createUploadHandlers = ({
  setFileUrl,
  setFileName,
  setUploading,
  onSuccess,
  onError,
}) => ({
  onClientUploadComplete: (res) => {
    if (res?.[0]) {
      const file = res[0];
      setFileUrl(file.url);
      setFileName(file.name);
      setUploading(false);
      onSuccess?.(file);
    }
  },
  onUploadError: (error) => {
    setUploading(false);
    onError?.(error);
  },
  onUploadBegin: () => {
    setUploading(true);
  },
});
```

### 5. Constants Management

Tập trung config vào một file:

```javascript
// src/constants/fileUpload.js
export const FILE_UPLOAD_CONFIG = {
  ACCEPTED_TYPES: {
    "application/pdf": [".pdf"],
    "image/*": [".jpg", ".jpeg", ".png"],
  },
  MAX_SIZE: "10MB",
  SUPPORTED_EXTENSIONS: "PDF, JPG, PNG",
};
```

---

## ⚠️ Chú ý quan trọng

### Backend

1. **CORS Headers:** Phải thêm tất cả UploadThing headers vào CORS config
2. **JWT Secret:** Đảm bảo `JWT_SECRET` được load đúng từ `.env`
3. **Route Order:** UploadThing route phải được mount trước các routes có parameters (`/:id`)
4. **Error Handling:** Luôn throw `UploadThingError` trong middleware, không throw Error thông thường

### Frontend

1. **Headers:** Phải gửi `Authorization` header trong mỗi UploadButton
2. **Token:** Đảm bảo token được lấy đúng từ localStorage/cookie
3. **Accept Types:** Phải khớp với backend FileRouter config
4. **State Management:** Quản lý state cho `uploading`, `fileUrl`, `fileName`
5. **Error Handling:** Luôn handle `onUploadError` để show error cho user

### Database

1. **Field Type:** Nếu lưu JSON, dùng `TEXT` hoặc `VARCHAR` đủ dài (URL có thể dài)
2. **Backward Compatibility:** Hỗ trợ cả format cũ (URL string) và format mới (JSON)
3. **Migration:** Không cần migration nếu dùng JSON string (backward compatible)

---

## 🔍 Troubleshooting

### Lỗi: "Missing API Key"

**Nguyên nhân:** `UPLOADTHING_TOKEN` chưa được set trong `.env`

**Giải pháp:**
1. Kiểm tra file `.env` có `UPLOADTHING_TOKEN`
2. Khởi động lại server sau khi thêm env variable

### Lỗi: CORS "Request header field x-uploadthing-package is not allowed"

**Nguyên nhân:** Thiếu UploadThing headers trong CORS config

**Giải pháp:**
Thêm các headers sau vào `allowedHeaders`:
- `x-uploadthing-package`
- `x-uploadthing-version`
- `traceparent`
- `b3`

### Lỗi: "Unauthorized"

**Nguyên nhân:** 
1. Token không được gửi từ frontend
2. Token không hợp lệ
3. JWT_SECRET không đúng

**Giải pháp:**
1. Kiểm tra `headers` prop trong UploadButton có `Authorization`
2. Kiểm tra token có hợp lệ không
3. Kiểm tra `JWT_SECRET` trong backend

### Lỗi: "Route not found" hoặc 404

**Nguyên nhân:** Route handler chưa được mount

**Giải pháp:**
1. Kiểm tra `app.use("/api/uploadthing", ...)` đã được thêm vào `index.js`
2. Kiểm tra route được mount trước các routes khác

### File picker chỉ hiển thị một loại file

**Nguyên nhân:** `accept` prop không đúng hoặc thiếu

**Giải pháp:**
1. Kiểm tra `accept` prop trong UploadButton
2. Đảm bảo format đúng: `{"mime/type": [".ext"]}`

---

## 📝 Checklist Setup

### Backend
- [ ] Cài đặt `uploadthing` package
- [ ] Tạo file `src/uploadthing.js` với FileRouter
- [ ] Mount route handler trong `index.js`
- [ ] Thêm `UPLOADTHING_TOKEN` vào `.env`
- [ ] Cấu hình CORS với UploadThing headers
- [ ] Test route: `GET /api/uploadthing` (sẽ trả về route config)

### Frontend
- [ ] Cài đặt `@uploadthing/react` package
- [ ] Tạo file `src/utils/uploadthing.js`
- [ ] Tạo constants file (optional)
- [ ] Sử dụng UploadButton trong component
- [ ] Thêm `headers` với Authorization token
- [ ] Thêm `accept` prop với file types
- [ ] Handle upload callbacks (onClientUploadComplete, onUploadError, etc.)
- [ ] Lưu file data (url + name) vào database

### Testing
- [ ] Test upload file thành công
- [ ] Test error handling (invalid token, file too large, etc.)
- [ ] Test hiển thị file đã upload
- [ ] Test download file
- [ ] Test backward compatibility (file cũ)

---

## 🚀 Quick Start Prompt

Copy prompt này để setup nhanh cho dự án mới:

```
Tôi muốn setup UploadThing cho dự án Express.js + React/Next.js:

1. Backend:
   - Cài đặt package uploadthing
   - Tạo FileRouter với endpoint "gradeFiles" chấp nhận PDF và images (max 10MB)
   - Xác thực bằng JWT token từ Authorization header
   - Mount route handler tại /api/uploadthing
   - Cấu hình CORS để cho phép UploadThing headers

2. Frontend:
   - Cài đặt package @uploadthing/react
   - Tạo UploadButton component với endpoint "gradeFiles"
   - Gửi JWT token trong headers
   - Accept PDF và images
   - Lưu cả url và name vào database dưới dạng JSON

3. Hiển thị file:
   - Tạo component hiển thị tên file và nút xem/tải về
   - Hỗ trợ backward compatibility với file cũ

Làm theo best practices, clean code, không có debug logs.
```

---

## 📚 Tài liệu tham khảo

- [UploadThing Express Setup](https://docs.uploadthing.com/getting-started/express)
- [File Routes API](https://docs.uploadthing.com/file-routes)
- [React Components](https://docs.uploadthing.com/api-reference/react)
- [Authentication Guide](https://docs.uploadthing.com/concepts/auth-security)

---

## 💡 Tips

1. **Development:** Có thể giữ log trong `onUploadComplete` để debug
2. **Production:** Xóa tất cả console.log, chỉ giữ error handling
3. **File Size:** UploadThing có free tier, kiểm tra limits
4. **CDN:** UploadThing tự động serve file qua CDN, không cần config thêm
5. **Security:** Luôn verify token trong middleware, không trust client

---

**Chúc bạn setup thành công! 🎉**

