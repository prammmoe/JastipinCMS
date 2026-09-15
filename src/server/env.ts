import { z } from "zod";

const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_D1_DATABASE_ID: z.string().uuid(),
  CLOUDFLARE_D1_API_TOKEN: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  AUTH_SESSION_COOKIE_NAME: z.string().default("jastipin_session"),
});

let cached: z.infer<typeof schema> | undefined;
export function env() {
  cached ??= schema.parse(process.env);
  return cached;
}
