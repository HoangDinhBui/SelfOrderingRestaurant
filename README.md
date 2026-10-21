# 🍽️ Self-Ordering Restaurant Management System

A full-stack restaurant management system that streamlines the ordering, staffing, payment, and inventory processes. Designed for self-service environments, it supports real-time operations, secure authentication, and advanced facial recognition.

## 🔧 Technologies Used

- **Backend**: Spring Boot, Hibernate (JPA), RESTful APIs, GraphQL, WebSocket  
- **Database**: MySQL  
- **Authentication & Security**: JWT, OAuth2 (Google), Spring Security  
- **Utilities & Tools**: Lombok, DeepFace, OpenCV (facial recognition)  
- **Architecture**: Microservice-ready, MVC pattern & N-tiers Architecture

---

## 📚 Core Features

### 👤 User Management
- Role-based access: `ADMIN`, `STAFF`, `CUSTOMER`
- Support for Google OAuth2 login
- JWT-based authentication
- Password reset via token
- User status tracking: `ACTIVE`, `INACTIVE`, `PENDING`

### 📦 Orders & Payments
- Table-based ordering system
- Order lifecycle: `PENDING` → `PROCESSING` → `COMPLETED`
- Real-time order notifications via WebSocket
- Support for multiple payment methods: `CASH`, `CARD`, `ONLINE`
- Discount and total amount calculations

### 🧑‍🍳 Staff Management
- Staff assignment and shift scheduling
- Attendance with check-in/check-out status
- Face recognition for attendance using OpenCV + DeepFace
- Staff salary and status tracking

### 🪑 Table Management
- QR-based table scanning for self-ordering
- Table availability tracking

### 🍽️ Menu & Inventory
- Dish categorization and ingredient management
- Dynamic pricing and dish status updates
- Low stock alerts and real-time inventory sync
- Supplier tracking and ingredient sourcing

### 📊 Revenue & Analytics
- Daily revenue tracking by staff/date/category
- Automatic computation of net revenue and average order value
- Real-time sales insights

### 🔔 Notification System
- Real-time push notifications to users (e.g., order status, system alerts)
- Notification types: `ORDER_STATUS`, `TABLE_REQUEST`, `SYSTEM`

### 🗨️ Feedback & Reviews
- Post-order customer feedback with rating & comments
- Feedback status tracking: `NEW`, `REVIEWED`, `RESOLVED`

---

## 🧩 Database Overview

Key tables include:

- `users`: Core user identity and authentication  
- `staff`, `customers`: Profile data for different roles  
- `orders`, `order_items`, `payments`: Core ordering and transaction flow  
- `tables`: Physical tables for QR-based ordering  
- `shifts`, `staff_shifts`, `attendances`: Staff schedule and presence  
- `dishes`, `categories`, `ingredients`, `dish_ingredients`: Menu and stock  
- `inventory`, `suppliers`: Ingredient stock and sourcing  
- `revenue`: Daily business metrics  
- `notifications`, `customer_feedback`: Engagement and feedback  

---

## 🔐 Authentication Flow

- **JWT Tokens**: Issued upon login, required for accessing protected routes.  
- **OAuth2**: Allows Google-based login using the `google_id` field.  
- **Face Recognition**: Validates staff attendance using facial data.  

---

## 🚀 Real-Time Capabilities

- **WebSocket**: Enables instant order updates and notifications to staff/customers.  
- **GraphQL**: Offers flexible querying for clients requiring specific data structures.  

---

## 📁 Future Enhancements

- Admin dashboard with visual analytics (charts, heatmaps)  
- Staff performance evaluation reports  
- Integration with third-party payment gateways (e.g., MoMo, VNPay)  
- Mobile app support for QR scanning and order tracking  
- Auto-scheduling based on staff availability and workload  

---

## 📌 Setup Instructions

1. **Clone the repository**
2. **Configure database in `application.yml`**
3. **Run `mvn clean install`**
4. **Start the Spring Boot application**
5. **Access the API via Postman or your frontend client**

---

## 👨‍💻 Developers

Developed as part of a self-service restaurant automation project.  
Feel free to contribute, fork, or raise issues.

### Thành viên hiện tại

| Thành viên | Liên hệ |
|-----------|---------|
| Hoàng (HoangBD) — chủ repo | buidinhhoang1910@gmail.com |
| Dung (MY DUNG) | dungne812@gmail.com |
| Tú (MinhTu) | hoanglam21092005@gmail.com (tài khoản mới; email cũ minhtu06041@gmail.com) |

Xem chi tiết đóng góp theo lịch sử commit: `git shortlog -sne` (các danh tính trùng đã được gộp qua `.mailmap`).
