# MediSlot

A modern appointment scheduling platform for medical clinics.

## Tech Stack

- *Frontend:* Next.js, React, TypeScript, Tailwind CSS
- *Backend:* FastAPI, Python
- *Database:* PostgreSQL
- *ORM:* SQLAlchemy + Alembic

## Seeding the default admin

The admin account is created only through the seed script (not via public
registration). After running the database migrations, run from the `backend`
directory:

```bash
python -m app.seed
```

This creates an admin you can log in with:

- **Email:** `admin@gmail.com`
- **Password:** `admin12345`

The script is idempotent — running it again won't create duplicates. Use this
admin to add doctors and manage the admin pages.
