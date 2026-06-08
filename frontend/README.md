# MediSlot — Frontend

Web client for MediSlot, an appointment-scheduling SaaS for medical clinics.
Next.js (App Router) + TypeScript. All logic, auth, and data live on the FastAPI
backend — this app renders UI and calls the API.


## Landing page design

Single-page marketing site,

### Hero
![Hero](docs/landing/1.png)

### Features
![Features](docs/landing/2.png)

### Workflow
![Workflow](docs/landing/3.png)

### Dashboard
![Dashboard](docs/landing/4.png)

### Pricing
![Pricing](docs/landing/5.png)

### FAQ
![FAQ](docs/landing/6.png)

### CTA & Footer
![CTA and footer](docs/landing/7.png)

## Roles

- Patient — dashboard, book, appointments, profile
- Doctor — dashboard, schedule, visit recordings
- Staff — dashboard, providers, services, slots, appointments, queue

## Tech stack

Next.js 16 · React 19 · TypeScript · axios · Tailwind CSS

## Getting started

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
```

Open http://localhost:3000.
