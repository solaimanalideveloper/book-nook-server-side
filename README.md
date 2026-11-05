# Book-Nook সার্ভার-সাইড API

Book-Nook অ্যাপ্লিকেশনের সার্ভার-সাইড API। এই সার্ভার বইয়ের তথ্য MongoDB-তে সংরক্ষণ করে এবং বই যোগ, দেখা, সম্পাদনা, মুছে ফেলা, ধার নেওয়া ও ফেরত দেওয়ার endpoint দেয়।

## লাইভ সার্ভার

**বেস URL:** https://book-nook-server-side-ten.vercel.app

## ব্যবহৃত প্রযুক্তি ও প্যাকেজ

- **Node.js** — সার্ভার চালানোর পরিবেশ।
- **Express 5** — HTTP সার্ভার ও API route তৈরি।
- **MongoDB Node.js Driver** — MongoDB-তে সংযোগ এবং বইয়ের তথ্য সংরক্ষণ ও পরিবর্তন।
- **MongoDB Atlas** — ডেটাবেস সেবা; ডেটাবেসের নাম `bookstore`, collection-এর নাম `book-nook`।
- **JOSE** — JWT যাচাই এবং JWKS endpoint থেকে public key আনার জন্য।
- **dotenv** — `.env` ফাইল থেকে environment variable লোড।
- **CORS** — অন্য origin থেকে API request গ্রহণ।
- **Vercel** — সার্ভার deploy ও host করা।

প্রকল্পটি JavaScript ES Module (`"type": "module"`) ব্যবহার করে।

## API তালিকা

নিচে কোডে থাকা ৮টি মূল API দেওয়া হয়েছে। `:id`-এর জায়গায় সংশ্লিষ্ট বইয়ের MongoDB `_id` দিতে হবে।

| # | কাজ | Method | Endpoint | Token |
|---|---|---|---|---|
| ১ | নতুন বই যোগ | `POST` | [`/add-books`](https://book-nook-server-side-ten.vercel.app/add-books) | প্রয়োজন |
| ২ | সব বই দেখা | `GET` | [`/all-books`](https://book-nook-server-side-ten.vercel.app/all-books) | প্রয়োজন নেই |
| ৩ | নির্দিষ্ট বই দেখা | `GET` | `/all-books/:id` | প্রয়োজন |
| ৪ | বইয়ের তথ্য সম্পাদনা | `PATCH` | `/all-books/:id` | প্রয়োজন |
| ৫ | বই মুছে ফেলা | `DELETE` | `/all-books/:id` | প্রয়োজন |
| ৬ | বই ধার নেওয়া | `POST` | `/borrow-book/:id` | প্রয়োজন |
| ৭ | ধার করা বই ফেরত দেওয়া | `DELETE` | `/borrowed-books/:id` | প্রয়োজন নেই |
| ৮ | বই ফেরত দেওয়া | `POST` | `/return-book/:id` | প্রয়োজন নেই |

উদাহরণ: নির্দিষ্ট বইয়ের সম্পূর্ণ URL হবে:
`https://book-nook-server-side-ten.vercel.app/all-books/BOOK_ID`

### Token পাঠানোর নিয়ম

যেসব API-তে token প্রয়োজন, সেগুলোর `Authorization` হেডারে `Bearer`-এর পরে JWT token পাঠাতে হবে।

সার্ভার `CLIENT_URL`-এর `/api/auth/jwks` endpoint ব্যবহার করে JWT যাচাই করে। Token না থাকলে middleware `401` দেয়। Token যাচাই ব্যর্থ হলে বর্তমান implementation `500` status দেয়।

## API-গুলোর request/response

### ১. নতুন বই যোগ — `POST /add-books`

অনুরোধের হেডারে JWT token এবং JSON তথ্য পাঠান। `totalCopies` ধনাত্মক পূর্ণসংখ্যা হতে হবে। বইয়ের অন্য তথ্যগুলো অনুরোধের JSON থেকে সংরক্ষিত হয়।

```json
{
  "title": "বইয়ের নাম",
  "author": "লেখকের নাম",
  "totalCopies": 5
}
```

নতুন বই যোগ হলে `availableCopies` স্বয়ংক্রিয়ভাবে `totalCopies`-এর সমান হয়। `totalCopies` অনুপস্থিত বা ধনাত্মক পূর্ণসংখ্যা না হলে `400` status পাওয়া যায়।

### ২. সব বই দেখা — `GET /all-books`

Token ছাড়াই সব বইয়ের তালিকা দেয়।

### ৩. নির্দিষ্ট বই দেখা — `GET /all-books/:id`

বইয়ের MongoDB `_id` দিয়ে একটি বইয়ের তথ্য দেয়। JWT token প্রয়োজন।

### ৪. বই সম্পাদনা — `PATCH /all-books/:id`

JWT token প্রয়োজন। JSON body-তে পরিবর্তন করতে চাওয়া field-গুলো পাঠাতে হবে।

```json
{
  "title": "নতুন বইয়ের নাম"
}
```

### ৫. বই মুছে ফেলা — `DELETE /all-books/:id`

JWT token প্রয়োজন। নির্দিষ্ট `_id`-এর বই মুছে দেয়।

### ৬. বই ধার নেওয়া — `POST /borrow-book/:id`

JWT token প্রয়োজন। বই পাওয়া না গেলে `404`, আর কোনো কপি উপলভ্য না থাকলে `400` status দেয়। ধার সফল হলে `availableCopies` এক কমে।

### ৭–৮. বই ফেরত দেওয়া — `DELETE /borrowed-books/:id` এবং `POST /return-book/:id`

দুটি endpoint-ই নির্দিষ্ট বই ফেরত দেওয়ার একই কাজ করে এবং বর্তমানে token চায় না। ফেরত দেওয়ার মতো কপি না থাকলে `400`, বই না থাকলে `404` status দেয়। সফল হলে `availableCopies` এক বাড়ে।

> **নোট:** বর্তমান backend-এ ধার নেওয়া বইয়ের আলাদা borrower/borrow-history record রাখা হয় না; শুধু বইয়ের `availableCopies` সংখ্যা পরিবর্তিত হয়। `GET /borrows` endpoint-ও বর্তমান code-এ নেই।

## অতিরিক্ত route

`GET /` একটি health-check route; এটি `{ "message": "Server is running find !" }` ফেরত দেয়। এটি উপরের ৮টি মূল API-র তালিকার বাইরে। তাই সব HTTP route গুনলে health-check-সহ মোট ৯টি route আছে।

## Environment variable

সার্ভার চালাতে নিচের environment variable-গুলো দিতে হবে:

| Variable | ব্যবহার |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_URL` | JWT যাচাইয়ের JWKS endpoint-এর মূল URL; সার্ভার এর শেষে `/api/auth/jwks` যোগ করে |

স্থানীয়ভাবে `.env` ফাইল তৈরি করে variable-গুলো নির্ধারণ করুন:

```env
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=https://your-client-domain.example
```

`.env`-এ আসল secret বা connection string থাকলে সেটি repository-তে commit বা প্রকাশ করবেন না।

## স্থানীয়ভাবে চালানো

Node.js ইনস্টল থাকার পর:

```bash
npm install
```

`package.json`-এ বর্তমানে `start` script নেই। তাই `npm start` চালাতে হলে আগে script যোগ করতে হবে; আপাতত সরাসরি চালান:

```bash
node index.js
```

সার্ভার `http://localhost:8000` ঠিকানায় চালু হয়। প্রয়োজনীয় environment variable আগে সেট করা থাকতে হবে।

## Deploy

Vercel configuration (`vercel.json`) `index.js`-কে `@vercel/node` runtime দিয়ে deploy করে এবং সব incoming path-কে `index.js`-এ পাঠায়। লাইভ বেস URL: https://book-nook-server-side-ten.vercel.app

## গুরুত্বপূর্ণ সীমাবদ্ধতা

- `GET /all-books/:id`, `PATCH /all-books/:id`, `DELETE /all-books/:id`, `POST /add-books` এবং `POST /borrow-book/:id`-এ token লাগে।
- `GET /all-books`, `DELETE /borrowed-books/:id` এবং `POST /return-book/:id` public।
- নির্দিষ্ট বইয়ের route-এ ভুল MongoDB ID format পাঠালে বর্তমান implementation সেটি আগে থেকে যাচাই করে না।
- স্বয়ংক্রিয় পরীক্ষার script এখনো নির্ধারণ করা হয়নি।
