# Surmakuulutus

**Surmakuulutus** is a **free online web app** for creating and posting obituaries. It features a modern, responsive interface and a full-stack setup, making it easy to submit, view, and manage obituary announcements online.

**Live Demo:**

- Frontend: [Netlify](https://surmakuulutus.netlify.app/)
- Backend/API: [Github](https://github.com/Fenrisulfr27/surmakuulutus-back)

---

## Project Structure

| Part                               | Description                                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** (`surmakuulutus`)     | Built with **Next.js + React + TypeScript**, includes responsive UI components from **Mantine** and app-router based navigation. Hosted on **Netlify**.                                 |
| **Backend** (`surmakuulutus-back`) | Built with **Node.js + TypeScript + Express**, connects to **MongoDB Atlas** for storing obituary data. Handles API routes, validation, and error management. Hosted on **Render.com**. |

---

## Key Features

- Create and submit obituary posts via web form
- Display obituaries in a clean, readable layout
- Fully responsive UI for desktop and mobile devices
- REST API backend handles data storage and retrieval
- Hosted online for instant access

---

## Technologies Used

**Frontend:** Next.js, React, TypeScript, Mantine, ESLint
**Backend:** Node.js, TypeScript, Express.js, MongoDB Atlas, Docker, Render.com

---

## Development Setup

### Frontend

```bash
git clone https://github.com/Fenrisulfr27/surmakuulutus.git
cd surmakuulutus
npm install
npm run dev
```

### Frontend build

```bash
npm run build
npm run preview
```

### Backend note

The Express backend is now handled inside this Next.js app through `/api/ads` and `/api/ads/[slug]`, so a separate backend repository is no longer required unless you want to keep an independently deployed API.

Set `MONGO_URI` in your environment to connect to MongoDB Atlas.
