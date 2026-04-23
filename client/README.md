# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this tem📌 What is MongoDB?

MongoDB is a NoSQL database that stores data in JSON-like format (BSON) instead of tables like in relational databases.

Key points:
	•	Data is stored as documents (key-value pairs)
	•	Documents are grouped into collections
	•	Collections are grouped into a database
	•	Schema is flexible (no fixed structure required)

⸻

⚙️ Process to Create Database & Collection in MongoDB

MongoDB follows a lazy creation approach (it creates DB/collection automatically when data is inserted).

1. Start MongoDB Shell

mongosh

2. Create / Switch Database

use collegeDB

👉 If collegeDB does not exist, it will be created when you insert data.

3. Create Collection

db.createCollection("students")

👉 Now a collection named students is created inside collegeDB.

⸻

📥 Insert Documents into Collection

1. Insert One Document

db.students.insertOne({
  name: "Raj Amrutiya",
  age: 20,
  course: "Computer Engineering"
})

2. Insert Multiple Documents

db.students.insertMany([
  { name: "Amit", age: 21, course: "IT" },
  { name: "Neha", age: 22, course: "CSE" },
  { name: "Priya", age: 20, course: "ECE" }
])


⸻

📊 Structure Example (Document Format)

{
  "_id": ObjectId("..."),
  "name": "Raj Amrutiya",
  "age": 20,
  "course": "Computer Engineering"
}


⸻

🔁 Summary (Easy Understanding)
	•	MongoDB = NoSQL, document-based database
	•	use DB_name → create/select database
	•	createCollection() → create collection
	•	insertOne() / insertMany() → add data

⸻

If you want, I can also give diagram + viva questions + short notes for exams 👍plate because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
