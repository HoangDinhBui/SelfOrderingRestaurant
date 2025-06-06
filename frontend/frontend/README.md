# 🖥️ Self-Ordering Restaurant - Frontend (ReactJS)

This is the frontend client for the Self-Ordering Restaurant Management System. Built with **ReactJS**, this modern web app allows customers and staff to interact with the system in real time via **WebSockets**, and fetch data efficiently using **GraphQL**.

---

## 🌐 Live Features

- ✅ Customer self-ordering via QR Code  
- ✅ Real-time order status updates using WebSocket  
- ✅ GraphQL-based efficient data querying  
- ✅ Role-based interfaces: `Customer`, `Staff`, `Admin`  
- ✅ Dark mode UI and responsive design  
- ✅ Secure login via JWT and Google OAuth2  
- ✅ Staff attendance via webcam and face recognition  
- ✅ Real-time notifications and feedback system

---

## 🔧 Technologies Used

| Category       | Tech Stack                                     |
|----------------|------------------------------------------------|
| Framework      | ReactJS (Hooks, Context API, Lazy Loading)     |
| Realtime       | WebSocket (native & Socket.IO if needed)       |
| Data Layer     | GraphQL (Apollo Client)                        |
| State Mgmt     | Context API / Redux Toolkit (optional)         |
| Routing        | React Router v6                                |
| Styling        | Tailwind CSS / Styled Components               |
| Auth           | JWT, Google OAuth2                             |
| Utilities      | Axios, Lodash, Day.js                          |
| Face Recognition | DeepFace via webcam integration              |

---

## 📁 Project Structure

```
/src
 ├── assets/              # Static files (images, icons)
 ├── components/          # Reusable UI components
 ├── pages/               # Page-level views (Home, Menu, Orders...)
 ├── contexts/            # Global context (Auth, Cart, Notification...)
 ├── graphql/             # Apollo client setup and GraphQL queries
 ├── hooks/               # Custom React hooks
 ├── services/            # API & WebSocket services
 ├── styles/              # Global styles (Tailwind, theme, ...)
 └── App.jsx              # Root component
```

---

## 🔐 Authentication

- JWT-based login flow with session storage
- Google OAuth2 login (redirect to backend)
- Protected routes for role-based access

---

## 📦 Core Features

### 👨‍🍳 Customer Interface
- Scan table QR → View menu → Add to cart → Place order
- View live order status updates
- Submit feedback & rating after service
- Realtime push notifications (e.g., order completed)

### 🧑‍🏭 Staff Interface
- Realtime order list (updated via WebSocket)
- Confirm / reject / complete orders
- View shift schedule and check-in with face recognition
- Internal notifications (e.g., table requests)

### 🛠️ Admin Interface
- Dashboard of revenue, staff activity, and system usage
- Manage menu, categories, staff roles (CRUD operations)

---

## 📡 WebSocket Usage

Used for:
- Realtime order updates to staff dashboard
- Live notification system (both customer & staff)
- Broadcast changes (e.g., table availability, system alerts)

```js
const socket = new WebSocket("ws://localhost:8080/ws");
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // handle order/notification updates
};
```

---

## 📊 GraphQL Integration

Apollo Client is used for efficient communication with the backend.

```js
import { gql, useQuery } from '@apollo/client';

const GET_MENU = gql`
  query {
    allDishes {
      id
      name
      price
      category
    }
  }
`;

const { data, loading } = useQuery(GET_MENU);
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/restaurant-fe.git
cd restaurant-fe
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up `.env`
Create a `.env` file in the root:

```
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
REACT_APP_WEBSOCKET_URL=ws://localhost:8080/ws
```

### 4. Start Development Server
```bash
npm start
```

App runs at `http://localhost:3000`

---

## 🧪 Testing (optional)

- Component tests: Jest + React Testing Library  
- End-to-end: Cypress (optional setup)  

---

## 📦 Deployment

- Built with `npm run build`
- Deployable on Vercel, Netlify, or Docker with Nginx

---

## 🧠 Future Improvements

- Mobile-first PWA with offline mode  
- Admin analytics dashboard with Recharts  
- Voice-based ordering support (experimental)  
- Enhanced accessibility & screen reader support  

---

## 👨‍💻 Contributors

Built by a dedicated team of developers passionate about F&B tech.  
Feel free to fork, contribute, or raise an issue!

---
