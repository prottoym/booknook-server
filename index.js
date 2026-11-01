import express from "express";
import { MongoClient } from "mongodb";
import 'dotenv/config'
const app = express();
const port = 5000;

//mongoDB connection

const client = new MongoClient(process.env.MONGODB_URL
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

connectToMongoDB();


// localhost:5000/
app.get("/", (req, res) => {
  res.send("BookNook server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
