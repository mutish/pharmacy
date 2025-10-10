<!-- Copilot / AI agent guidance for the Pharmacy project -->
# Quick orientation (30-50 lines)

This repository is a full-stack pharmacy app with a Node/Express + MongoDB backend (in `backend/`) and a Vite + React client (in `client/`). Key responsibilities for an AI code agent:

- Backend: REST API controllers in `backend/controllers/` wired to routes in `backend/routes/` and data models in `backend/models/`.
- Frontend: React pages/components live in `client/src/` wired by Vite (`client/package.json`).
- Uploads: user prescription files are stored in `uploads/prescriptions/` and handled by `backend/middleware/upload.middleware.js` (multer).

## How to run (developer flows)

- Start the backend in dev: npm run server (from repo root) — this runs `nodemon backend/server.js` (see root `package.json`).
- Start the frontend dev server: cd client && npm run dev (Vite).
- Environment: the backend expects a `.env` with at least MONGO_DB_URI, JWT_SECRET, CLOUDINARY_* keys, MPESA_* keys, MAIL_USER/MAIL_PASS. See `backend/config/*` and controllers for exact env names.

## Important architecture & patterns

- Authentication: cookie-based JWT. Middleware `backend/middleware/protectRoute.js` reads `req.cookies.jwt`, verifies with `JWT_SECRET`, and attaches `req.user`. Use `authorize(...roles)` for role checks (e.g., `authorize('pharmacist')`).
- Controllers follow a conventional CRUD pattern (e.g., `product.controller.js`, `prescription.controller.js`). Routes simply import controllers and apply `protectRoute` where needed (`backend/routes/*.js`).
- File uploads: `upload.single('file')` is used on `/api/prescription/upload`. Multer stores files under `uploads/prescriptions/` and controllers expect `req.file` and build fileUrl as `/uploads/prescriptions/${file.filename}`.
- OCR: `backend/utils/ocr.js` uses `tesseract.js` for images and `pdf-parse` for PDFs. The PDF OCR fallback (convert pages to images + OCR) is intentionally unimplemented and throws — search for `PDF OCR fallback not implemented` if you need to extend it.
- Payments: M-Pesa STK flow lives in `backend/controllers/checkout.controller.js` and `backend/utils/mpesaToken.js`. STK push uses Safaricom sandbox endpoints. The callback endpoint updates a `Checkout` record and order, reduces stock, and sends an email receipt via `nodemailer`.
- Media: product images are uploaded to Cloudinary using `backend/config/cloudinary.js` and `cloudinary.uploader.upload(imageFile, { folder: 'products', public_id })` in `product.controller.js`.
- Socket.io: referenced in messaging (`backend/controllers/message.controller.js`) but may be partially implemented — review controller for TODOs if working on chat.

## Conventions and gotchas (explicit)

- ID fields: many resources use custom IDs like `PR...` (products), `RX...` (prescriptions), `CO...` (checkouts). When creating or searching prefer the model field `productId` / `prescriptionId` instead of `_id` where controllers do so.
- Error handling: controllers often log full errors and return generic 500 responses. When debugging, inspect console logs (controllers print responses from external APIs, e.g., Mpesa) before changing behavior.
- File paths: OCR and upload code expect paths relative to project root. `ocr` strips a leading `/` and uses `process.cwd()` to resolve files — keep this in mind when adding tests or refactoring.
- Security: protectRoute expects JWT in cookies; many routes call `router.use(protectRoute)` at the top of the route file. Do not assume Authorization header is in use.

## Example references (use these in edits or tests)

- Protect middleware: `backend/middleware/protectRoute.js`
- Upload endpoint: `backend/routes/prescription.routes.js` and handler `backend/controllers/prescription.controller.js`
- OCR utils: `backend/utils/ocr.js` (image and PDF logic)
- Mpesa flow: `backend/controllers/checkout.controller.js` and `backend/utils/mpesaToken.js`
- Cloudinary product upload: `backend/controllers/product.controller.js` and `backend/config/cloudinary.js`

## When modifying behavior

- If you change upload storage or OCR file resolution, update `prescription.controller.js` parsing/paths and verify `uploads/prescriptions/` handling.
- If adding MPESA production support, separate sandbox vs prod endpoints and add config flags; current code hardcodes the sandbox URL.
- When changing auth, update all `router.use(protectRoute)` usages and tests that rely on cookie-based JWT.

If any section above is unclear or you need additional examples (sample .env, expected request payloads, or common response shapes), tell me which area to expand and I'll iterate.
