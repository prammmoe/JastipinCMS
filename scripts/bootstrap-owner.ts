import { createClient } from "@supabase/supabase-js";

async function main() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "OWNER_EMAIL",
    "OWNER_PASSWORD",
    "OWNER_NAME",
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
    email: process.env.OWNER_EMAIL!,
    password: process.env.OWNER_PASSWORD!,
    email_confirm: true,
  });
  if (result.error || !result.data.user) {
    throw result.error ?? new Error("Supabase Auth tidak mengembalikan user.");
  }

  const profile = await client.from("profiles").insert({
    id: result.data.user.id,
    name: process.env.OWNER_NAME!,
    role: "OWNER",
  });
  if (profile.error) {
    await client.auth.admin.deleteUser(result.data.user.id);
    throw profile.error;
  }

  console.log(`Owner created: ${result.data.user.id}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Bootstrap Owner gagal.");
  process.exitCode = 1;
});
