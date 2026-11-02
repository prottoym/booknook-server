
import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = process.env.PORT || 5000;

// Next.js site URL(s) that may call this server
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

// Base URL of the Next.js app that runs BetterAuth (must equal BETTER_AUTH_URL there)
const AUTH_URL = (process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);

let books;
let borrows;

/* ---------------------------- helpers ---------------------------- */

// catches errors from async route handlers
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toId = (id) => (/^[a-f\d]{24}$/i.test(String(id)) ? new ObjectId(String(id)) : null);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ------------------------- JWT verification ------------------------ */
// BetterAuth (jwt plugin) publishes its public keys at /api/auth/jwks
const JWKS = createRemoteJWKSet(new URL(`${AUTH_URL}/api/auth/jwks`));

async function verifyJWT(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized: please log in first" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: AUTH_URL });
    if (!payload.email) throw new Error("Token has no email");

    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      name: payload.name || "Reader",
    };
    next();
  } catch (error) {
    console.error("JWT check failed:", error.message);
    return res.status(401).send({ message: "Unauthorized: invalid or expired token" });
  }
}

/* ---------------------------- BOOK routes -------------------------- */

// 1) GET /books  (public)  ?sort=newest|oldest &limit=6 &email= &category= &search=
app.get(
  "/books",
  wrap(async (req, res) => {
    const { sort = "newest", limit, email, category, search } = req.query;

    const filter = {};
    if (email) filter.userEmail = String(email);
    if (category) filter.category = String(category);
    if (search) filter.title = { $regex: escapeRegex(String(search)), $options: "i" };

    let cursor = books.find(filter).sort({ createdAt: sort === "oldest" ? 1 : -1 });

    const n = parseInt(limit, 10);
    if (n > 0) cursor = cursor.limit(Math.min(n, 100));

    res.send(await cursor.toArray());
  })
);


/* --------------------------- BORROW routes ------------------------- */

// 6) POST /borrows  (JWT)  body: { bookId, returnDate }
app.post(
  "/borrows",
  verifyJWT,
  wrap(async (req, res) => {
    const { bookId, returnDate } = req.body;

    const _id = toId(bookId);
    if (!_id) return res.status(400).send({ message: "Invalid book id" });

    const returnOn = new Date(returnDate);
    if (Number.isNaN(returnOn.getTime()) || returnOn <= new Date()) {
      return res.status(400).send({ message: "Please pick a return date in the future" });
    }

    const book = await books.findOne({ _id });
    if (!book) return res.status(404).send({ message: "Book not found" });

    // No double borrow
    const already = await borrows.findOne({ bookId: String(_id), userEmail: req.user.email });
    if (already) {
      return res.status(409).send({ message: "You have already borrowed this book" });
    }

    // Take one copy ($inc -1) only if a copy is still available
    const reserve = await books.updateOne(
      { _id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } }
    );
    if (reserve.modifiedCount === 0) {
      return res.status(409).send({ message: "Sorry, this book is not available right now" });
    }

    const doc = {
      bookId: String(_id),
      bookTitle: book.title,
      bookImage: book.image,
      userName: req.user.name,
      userEmail: req.user.email,
      borrowDate: new Date(),
      returnDate: returnOn,
    };

    try {
      const result = await borrows.insertOne(doc);
      res.status(201).send({ ...doc, _id: result.insertedId });
    } catch (error) {
      // give the copy back if saving the borrow failed
      await books.updateOne({ _id }, { $inc: { availableCopies: 1 } });
      if (error.code === 11000) {
        return res.status(409).send({ message: "You have already borrowed this book" });
      }
      throw error;
    }
  })
);

// 7) GET /borrows  logged in user's borrows
app.get(
  "/borrows",
  verifyJWT,
  wrap(async (req, res) => {
    const list = await borrows
      .find({ userEmail: req.user.email })
      .sort({ borrowDate: -1 })
      .toArray();
    res.send(list);
  })
);



/* ------------------------------ misc ------------------------------- */

app.get("/", (req, res) => res.send("BookNook server is running"));

app.use((req, res) => res.status(404).send({ message: "Route not found" }));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ message: "Something went wrong on the server" });
});

async function start() {
  await client.connect();
  console.log("You successfully connected to MongoDB!");

  const db = client.db(process.env.DB_NAME || "booknook");
  books = db.collection("books");
  borrows = db.collection("borrows");

  // Indexes are a bonus: if they fail, the server should still start.
  // The unique index backs up the "no double borrow" rule.
  try {
    await borrows.createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
    await books.createIndex({ createdAt: -1 });
  } catch (error) {
    console.warn("Could not create indexes (server continues):", error.message);
  }

  app.listen(port, () => console.log(`BookNook server running on port ${port}`));
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});