# Deployment Staging dan Production

## Environment map

| Target | Git branch | Supabase | Vercel | URL |
| --- | --- | --- | --- | --- |
| Staging | `staging` | `rwcrzhfvpgzvqdedpfwp` (Tokyo) | Preview | `https://jastipin-cms-staging.vercel.app` |
| Production | `main` | `uobltqmvlatdvaxpgerd` (Singapore) | Production | `https://jastipin-cms.vercel.app` |

Browser tetap hanya berkomunikasi dengan `/api/v1/*`. Setiap deployment menggunakan Supabase URL dan secret backend milik environment-nya sendiri.

Tooling deployment dipin ke Supabase CLI `2.40.7`, Vercel CLI `59.1.3`, Node.js 22, dan pnpm 11.19.0.

Resource Vercel yang sudah dibuat:

- Scope: `prammmoes-projects`
- Project: `jastipin-cms`
- Organization ID: `team_vwdfHfQRxO3Wl9YNhOhengoA`
- Project ID: `prj_rhbZYFoNF4ysu6rId120EY1aeEgR`

Checkout lokal sengaja ditautkan ke Supabase staging agar perintah `supabase` saat development tidak menyentuh production secara tidak sengaja.

## GitHub Environments

Buat GitHub Environments bernama `staging` dan `production`. Masukkan secret berikut ke masing-masing environment:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Gunakan project ref dan database password yang berbeda. `VERCEL_*` mengarah ke satu project Vercel yang sama. Jangan memasukkan secret ke repository, issue, pull request, atau log workflow.

## Vercel variables

Set variabel berikut pada target Preview menggunakan kredensial staging dan target Production menggunakan kredensial production:

- `APP_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (Sensitive)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY` (Sensitive)
- `CLOUDINARY_API_SECRET` (Sensitive)
- `AUTH_ACCESS_COOKIE_NAME=jastipin_access`
- `AUTH_REFRESH_COOKIE_NAME=jastipin_refresh`

`APP_URL` harus sama persis dengan origin target karena mutation API memvalidasi header Origin.
Cloudinary memakai signed-in server upload melalui API key dan secret; jangan pernah
menambahkan `CLOUDINARY_API_SECRET` ke variabel `NEXT_PUBLIC_*`.

Variabel tersebut sudah dipasang pada project Vercel. Saat memasukkannya ulang melalui CLI, gunakan `printf '%s' "$VALUE"`, bukan `echo`, agar tidak ada karakter newline yang ikut tersimpan. Production menggunakan legacy `service_role` pada variabel backend-only `SUPABASE_SECRET_KEY`; key `sb_secret_` tidak dapat ditampilkan ulang sebagai plaintext setelah dibuat. Jangan pernah mengekspos variabel ini ke browser.

## Promotion flow

1. Push atau merge perubahan ke `staging`.
2. Workflow memvalidasi codebase, meninjau lalu menerapkan migrasi staging, dan memperbarui URL staging.
3. Jalankan acceptance test pada staging.
4. Merge `staging` ke `main`.
5. Workflow melakukan langkah yang sama ke production dan menerbitkan deployment production.

Migrasi harus forward-compatible. Untuk perubahan destruktif, gunakan pola expand–migrate–contract dalam beberapa rilis.

## Initial admin

Bootstrap Admin dilakukan terpisah untuk setiap environment. Akun `OWNER` lama dimigrasikan menjadi `ADMIN`. Untuk environment baru, muat seluruh variabel Supabase dan Admin target, lalu jalankan script tanpa menyimpan password ke Git:

```bash
pnpm tsx --env-file=.env.target scripts/bootstrap-admin.ts
```

## Manual GitHub setup

Repository tujuan: `https://github.com/prammmoe/JastipinCMS.git`.

```bash
git remote add origin https://github.com/prammmoe/JastipinCMS.git
git add -A
git commit -m "feat: initialize JASTIPin CMS"
git push -u origin main
git branch staging
git push -u origin staging
```

Setelah push, buat GitHub Environments dan secrets sebelum menjalankan workflow deployment secara manual.

## Langkah dashboard yang tersisa

CLI yang dipin tidak menyediakan rename project. Selesaikan dua pengaturan non-runtime berikut di Supabase Dashboard:

1. Ubah nama project `rwcrzhfvpgzvqdedpfwp` dari `Jastipin CMS` menjadi `Jastipin CMS Staging`.
2. Set Authentication Site URL staging ke `https://jastipin-cms-staging.vercel.app` dan production ke `https://jastipin-cms.vercel.app`.

Backend saat ini menggunakan password login tanpa redirect email, sehingga dua pengaturan dashboard tersebut tidak memblokir login atau deployment.
