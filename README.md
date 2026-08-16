# JASTIPin CMS

Sistem informasi internal untuk mencatat paket dari penerimaan di Sidoarjo sampai closing, pengiriman, kedatangan Merauke, pembayaran, dan pengambilan.

## Arsitektur

Browser hanya mengakses endpoint same-origin `/api/v1/*`. Seluruh Supabase Auth, PostgreSQL, dan Storage berada di `src/server/` dan tidak pernah diakses langsung oleh Client Components.

## Setup lokal

1. Gunakan Node.js 22 dan pnpm 11.
2. Salin `.env.example` menjadi `.env.local`, lalu isi kredensial Supabase lokal.
3. Jalankan `supabase start`, kemudian `supabase db reset`.
4. Generate types dengan `pnpm db:types`.
5. Buat Admin pertama:

   ```bash
   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='password-yang-kuat' ADMIN_NAME='Admin' pnpm tsx scripts/bootstrap-admin.ts
   ```

6. Jalankan `pnpm dev` dan buka `http://localhost:3000`.

## Verifikasi

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Project staging dan production sudah dipisahkan di Supabase dan Vercel. Local checkout ditautkan ke staging; deployment otomatis dijalankan oleh GitHub Actions setelah GitHub Environments diisi.

## Deployment

Konfigurasi staging/production, daftar secrets, dan promotion flow tersedia di [docs/deployment.md](docs/deployment.md).
