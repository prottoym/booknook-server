# 📚 BookNook — Server

** an Online Library Management System**

BookNook is the backend of an online library management system where users can explore books, add and manage their own books, borrow books, view borrowed books, and return them.

Built with **Node.js, Express.js, MongoDB, and Better Auth JWT authentication**.

---

## 🚀 Features

- 📖 **Book Management:** Create, read, update, and delete books.
- 🔍 **Search & Filter:** Search books by title and filter by category.
- ↕️ **Sorting:** Retrieve books by newest or oldest.
- 🔐 **JWT Authentication:** Verify user identity using Better Auth JWT and JWKS.
- 👤 **User Authorization:** Users can update or delete only their own books.
- 📚 **Borrow Books:** Authenticated users can borrow available books.
- 🔄 **Return Books:** Return borrowed books and restore available copies.
- 📦 **Copy Management:** Automatically update available copies when books are borrowed or returned.
- 🚫 **Duplicate Borrow Prevention:** Prevent users from borrowing the same book more than once.
- ⚠️ **Error Handling:** Handle invalid requests, unauthorized access, and server errors.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API development |
| MongoDB | Database |
| MongoDB Driver | Database operations |
| Better Auth | Authentication |
| JOSE | JWT verification |
| CORS | Cross-origin request handling |
| dotenv | Environment variable management |

---

## 📁 Project Structure

```text
booknook-server/
│
├── index.js
├── package.json
├── package-lock.json
├── .gitignore
└── .env
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prottoym/booknook-server.git
```

### 2. Navigate to the Project Directory

```bash
cd booknook-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000

MONGODB_URL=your_mongodb_connection_string

DB_NAME=booknook

CLIENT_ORIGINS=http://localhost:3000

AUTH_URL=http://localhost:3000
```

**Environment Variables:**

| Variable | Description |
|---|---|
| `PORT` | Server port |
| `MONGODB_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `CLIENT_ORIGINS` | Allowed frontend origin(s), comma-separated |
| `AUTH_URL` | Frontend Better Auth base URL |

Make sure `AUTH_URL` matches the Better Auth application's configured URL.

### 5. Run the Server

```bash
node index.js
```

For development with automatic restart:

```bash
npm install -D nodemon
npx nodemon index.js
```

Server will run at:

```text
http://localhost:5000
```

---

## 🔗 API Endpoints

**Base URL:** `http://localhost:5000`

### 📖 Book Routes

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/books` | Get all books | Public |
| GET | `/books/:id` | Get a single book | Public |
| POST | `/books` | Add a new book | Required |
| PATCH | `/books/:id` | Update a book | Required |
| DELETE | `/books/:id` | Delete a book | Required |

### 📚 Borrow Routes

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/borrows` | Borrow a book | Required |
| GET | `/borrows` | Get logged-in user's borrowed books | Required |
| DELETE | `/borrows/:id` | Return a borrowed book | Required |

---

## 🔍 API Query Parameters

The `GET /books` endpoint supports the following query parameters:

| Parameter | Description | Example |
|---|---|---|
| `sort` | Sort by newest or oldest | `sort=newest` |
| `limit` | Limit the number of results (maximum 100) | `limit=6` |
| `search` | Search books by title | `search=Atomic` |
| `category` | Filter by category | `category=Fiction` |
| `email` | Filter books by owner's email | `email=user@example.com` |

**Example:**

```http
GET /books?sort=newest&limit=6
```

```http
GET /books?category=Fiction&search=Harry
```

---

## 🔐 Authentication & Authorization

BookNook uses **Better Auth** for user authentication and JWT-based authentication for protecting backend API routes.

The backend verifies JWT tokens using Better Auth's JSON Web Key Set (JWKS).

Protected API requests must include an authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The backend:

- Verifies the JWT signature and issuer.
- Checks the user's identity.
- Rejects missing or invalid tokens.
- Restricts book updates and deletions to their owners.
- Allows users to access only their own borrow records.

---

## 📦 Borrowing System

The borrowing system maintains accurate book availability.

- A user can borrow a book only when copies are available.
- Available copies decrease by one after a successful borrow.
- Users cannot borrow the same book twice.
- Returning a book increases available copies by one.
- If no copies are available, the borrowing request is rejected.

MongoDB atomic update operations help prevent multiple requests from borrowing the same remaining copy.

---

## 🗄️ Database Collections

The project uses MongoDB with two main collections:

### `books`

Stores book information, including:

- Title
- Author
- Category
- Image URL
- Description
- Total copies
- Available copies
- Owner name and email
- Creation date

### `borrows`

Stores borrowing information, including:

- Book ID
- Book title and image
- User name and email
- Borrow date
- Return date

---

## ⚠️ Error Handling

The API handles common errors with appropriate HTTP status codes:

| Status Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 500 | Internal server error |

---

## 👨‍💻 Author

**Prottoy Modak**

GitHub: [@prottoym](https://github.com/prottoym)

---
