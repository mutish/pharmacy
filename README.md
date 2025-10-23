# Pharmacy App

Full‑stack pharmacy application with a Node/Express + MongoDB backend and a HTML, CSS & JS frontend. Users can browse products, upload prescriptions (with OCR), checkout via M‑Pesa STK (sandbox), and manage orders with role‑based access (patient, pharmacist, admin).

## Features

- Authentication: cookie‑based JWT auth (patients, pharmacists, admins)
- Products: browse/search, details, images stored on Cloudinary
- Prescriptions: file upload (images/PDFs) to local storage with OCR parsing
- Checkout: M‑Pesa STK push (Safaricom sandbox) + email receipt
- Orders: status updates, stock reduction after successful payment
- Messaging (WIP): socket.io referenced for chat
- Secure patterns: role‑based authorization, protected routes

## Tech Stack

- Backend: Node.js, Express, MongoDB/Mongoose, JWT, Multer, Cloudinary, Nodemailer
- OCR: tesseract.js (images), pdf-parse (PDF text)
- Payments: M‑Pesa STK via Safaricom sandbox APIs
- Frontend: React + Vite, Tailwind/DaisyUI (UI), Axios
- Tooling: nodemon (dev), dotenv

## Getting Started

Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Cloudinary account (for product images)
- Safaricom Developer (sandbox) credentials for M‑Pesa
- SMTP account (e.g., Mailtrap, Gmail app password)

Install
- Backend deps are managed from repo root; frontend has its own deps.

```bash
# from repo root
npm install
cd client && npm install
```

Environment
Create a backend .env in the repo root with at least:

```bash
# Database & server
MONGO_DB_URI=mongodb://localhost:27017/pharmacy
PORT=5000
JWT_SECRET=replace-with-strong-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# M-Pesa (Safaricom sandbox)
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORT_CODE=174379
MPESA_PASSKEY=xxx
MPESA_CALLBACK_URL=http://your-tunnel-or-host/api/checkout/callback

# Mail (Nodemailer)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=xxx
MAIL_PASS=xxx
```

Note: See backend/config/* and controllers for exact env names if they differ.

Run (development)
- Terminal 1 (backend):

```bash
npm run server
# runs nodemon backend/server.js
```




## Project Structure

```
backend/
  controllers/        # REST controllers (auth, product, prescription, checkout, etc.)
  routes/             # Express routes wiring controllers + middleware
  models/             # Mongoose schemas (Product, Prescription, Order/Checkout, User, ...)
  middleware/         # protectRoute, authorize, upload (multer), etc.
  config/             # cloudinary config, other integrations
  utils/              # mpesa token util, OCR helpers (tesseract.js/pdf-parse)
  server.js           # Express app bootstrap
client/
  src/                # React app (pages/components/hooks/services)
uploads/
  prescriptions/      # Multer destination for uploaded prescription files
```

Key patterns and gotchas
- Authentication is cookie‑based. protectRoute reads req.cookies.jwt, verifies with JWT_SECRET, and populates req.user. Use authorize('pharmacist', 'admin') for role checks.
- File uploads use upload.single('file') and store under uploads/prescriptions/. Controllers expect req.file and build fileUrl like /uploads/prescriptions/${filename}.
- OCR handles images via tesseract.js and PDFs via pdf-parse. The PDF image‑OCR fallback is intentionally unimplemented and throws “PDF OCR fallback not implemented”.
- Payments use Safaricom sandbox endpoints; STK callback updates Checkout + Order, reduces stock, and emails a receipt.

## API Overview (quick reference)

Auth (/api/auth)
- POST /signup — create user
- POST /login — login (sets JWT cookie)
- POST /logout — clear session
- GET /me — get profile (auth)
- PATCH /me — update profile (auth)
- DELETE /me — delete account (auth)
- GET /allusers — list users (admin)
- POST /create — create user (admin)

Products (/api/products)
- GET / — list products (public)
- GET /category/:category — list by category (public)
- GET /:productId — product details (public)
- POST /add — add product (pharmacist/admin)
- PUT /update/:productId — update product (pharmacist/admin)
- DELETE /delete/:productId — delete (admin)

Prescriptions (/api/prescription)
- POST /upload — upload prescription file (auth, upload.single('file')), OCR processed

Checkout (/api/checkout)
- POST /stk-push — initiate M‑Pesa STK push (auth)
- POST /callback — M‑Pesa callback (Safaricom -> backend)

Note: Exact routes may include prefixes; check backend/routes/*.js for current paths.

## Development Notes

- Static files: uploads/prescriptions/ should be served statically in backend/server.js.
- Cloudinary: product images uploaded via cloudinary.uploader.upload(imageFile, { folder: 'products', public_id }).
- CORS/cookies: ensure Vite origin is allowed; cookies must be sent with credentials for protected calls.
- Logs: controllers log external API responses for debugging (e.g., M‑Pesa). 500s return generic messages.

## Troubleshooting

- JWT not found: confirm cookie is set and same-site/cors config allows credentials.
- OCR errors on PDF: expected if fallback is hit; pdf-parse text extraction works, image fallback is not implemented.
- MPESA callback not firing: ensure your MPESA_CALLBACK_URL is reachable (use a tunnel like ngrok) and matches the registered URL.

## Scripts

- Backend: npm run server
- Frontend: cd client && npm run dev

## License

No license specified.
