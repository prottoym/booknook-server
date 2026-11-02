
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