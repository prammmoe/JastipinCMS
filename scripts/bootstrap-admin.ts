import { createClient } from "@supabase/supabase-js";

async function main() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "ADMIN_NAME",
  ] as const;
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const result = await client.auth.admin.createUser({
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    email_confirm: true,
  });
  if (result.error || !result.data.user) {
    throw result.error ?? new Error("Supabase Auth tidak mengembalikan user.");
  }
  const profile = await client.from("profiles").insert({
    id: result.data.user.id,
    name: process.env.ADMIN_NAME!,
    role: "ADMIN",
  });
  if (profile.error) {
    await client.auth.admin.deleteUser(result.data.user.id);
    throw profile.error;
  }
  console.log(`Admin created: ${result.data.user.id}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Bootstrap Admin gagal.");
  process.exitCode = 1;
});
