# Surmakuulutus

**Surmakuulutus** is a **free online web app** for creating and posting obituaries. It features a modern, responsive interface and a full-stack Next.js setup, making it easy to submit, view, and manage obituary announcements online.

**Live site:** [surmakuulutus.ee](https://surmakuulutus.ee/)

---

## Project Structure

| Part                           | Description                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **App** (`surmakuulutus`)      | Built with **Next.js + React + TypeScript**, includes responsive UI components from **Mantine** and App Router based navigation.                 |
| **API** (`src/app/api`)        | Next.js API routes connect to **MongoDB Atlas** for storing obituary data and handle validation, public listing, and individual obituary lookup. |

---

## Key Features

- Create and submit obituary posts via web form
- Display obituaries in a clean, readable layout
- Fully responsive UI for desktop and mobile devices
- Next.js API routes handle data storage and retrieval
- Hosted online for instant access

---

## Technologies Used

Next.js, React, TypeScript, Mantine, MongoDB Atlas, ESLint, Vitest

---

## Development Setup

```bash
git clone https://github.com/Fenrisulfr27/surmakuulutus.git
cd surmakuulutus
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Environment

Set `MONGO_URI` in your environment to connect the Next.js API routes to MongoDB Atlas.
