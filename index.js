import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";
import "dotenv/config";
import cors from "cors";


const app = express();
const PORT = 8000;


app.use(cors());
app.use(express.json());


const client = new MongoClient(process.env.MONGODB_URI);


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("bookstore");
const booksStoreCollection = db.collection("book-nook");



// JWT verification middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );
  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }
};


// Add a new book
app.post("/add-books", verifyToken, async (req, res) => {
  const data = req.body;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return res.status(400).json({ error: "Book details are required." });
  }
  const totalCopies = Number(data.totalCopies);
  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    return res
      .status(400)
      .json({ error: "totalCopies must be a positive integer." });
  }
  const result = await booksStoreCollection.insertOne({
    ...data,
    totalCopies,
    availableCopies: totalCopies,
  });
  console.log(result);
  res.send(result);
});


// Get all books
app.get("/all-books", async (req, res) => {
  const result = await booksStoreCollection.find().toArray();
  res.send(result);
});


// Get a specific book by id
app.get("/all-books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await booksStoreCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});


// Update a data for a specific book by id
app.patch("/all-books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const result = await booksStoreCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData },
  );
  res.json(result);
});


// Delete a specific book by id
app.delete("/all-books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await booksStoreCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
});


// Borrow a book
app.post("/borrow-book/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const book = await booksStoreCollection.findOne({ _id: new ObjectId(id) });
  if (!book) {
    return res.status(404).json({ error: "Book not found." });
  }
  if (book.availableCopies < 1) {
    return res.status(400).json({ error: "No available copies to borrow." });
  }
  const result = await booksStoreCollection.updateOne(
    { _id: new ObjectId(id) },
    { $inc: { availableCopies: -1 } },
  );
  res.json({ message: "Book borrowed successfully.", result });
});


// Delete a borrowed book (returning it)
app.delete("/borrowed-books/:id", async (req, res) => {
  const { id } = req.params;
  const book = await booksStoreCollection.findOne({ _id: new ObjectId(id) });
  if (!book) {
    return res.status(404).json({ error: "Book not found." });
  }
  if (book.availableCopies >= book.totalCopies) {
    return res.status(400).json({ error: "All copies are already returned." });
  }
  const result = await booksStoreCollection.updateOne(
    { _id: new ObjectId(id) },
    { $inc: { availableCopies: 1 } },
  );
  res.json({ message: "Book returned successfully.", result });
});


// Return a borrowed book
app.post("/return-book/:id", async (req, res) => {
  const { id } = req.params;
  const book = await booksStoreCollection.findOne({ _id: new ObjectId(id) });
  if (!book) {
    return res.status(404).json({ error: "Book not found." });
  }
  if (book.availableCopies >= book.totalCopies) {
    return res.status(400).json({ error: "All copies are already returned." });
  }
  const result = await booksStoreCollection.updateOne(
    { _id: new ObjectId(id) },
    { $inc: { availableCopies: 1 } },
  );
  res.json({ message: "Book returned successfully.", result });
});


// http://localhost:8000/



app.get("/", (req, res) => {
  res.send({ message: "Server is running find !" });
});


app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
