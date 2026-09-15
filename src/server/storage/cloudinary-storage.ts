import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/server/env";
import { AppError } from "@/server/errors/app-error";

const STORAGE_PREFIX = "cloudinary:";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  bytes?: number;
  format?: string;
  error?: { message?: string };
};

function config(): CloudinaryConfig {
  const values = env();
  const cloudName =
    values.CLOUDINARY_CLOUD_NAME ?? values.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !values.CLOUDINARY_API_KEY || !values.CLOUDINARY_API_SECRET)
    throw new AppError(
      "STORAGE_CONFIG_MISSING",
      "Konfigurasi Cloudinary belum lengkap.",
      undefined,
      500,
    );
  return {
    cloudName,
    apiKey: values.CLOUDINARY_API_KEY,
    apiSecret: values.CLOUDINARY_API_SECRET,
  };
}

function signature(params: Record<string, string>, apiSecret: string) {
  const canonical = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

export async function uploadCloudinaryImage(file: File, publicId: string) {
  const values = config();
  const signed = {
    overwrite: "false",
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
  const form = new FormData();
  form.set("file", file);
  Object.entries(signed).forEach(([key, value]) => form.set(key, value));
  form.set("api_key", values.apiKey);
  form.set("signature", signature(signed, values.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(values.cloudName)}/image/upload`,
    {
      method: "POST",
      body: form,
    },
  );
  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!response.ok || !result.public_id || !result.secure_url)
    throw new AppError(
      "CLOUDINARY_UPLOAD_FAILED",
      result.error?.message ?? "Foto gagal diunggah ke Cloudinary.",
      undefined,
      502,
    );
  return {
    storagePath: `${STORAGE_PREFIX}${result.public_id}`,
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes ?? file.size,
    format: result.format,
  };
}

export async function deleteCloudinaryImage(storagePath: string) {
  const publicId = cloudinaryPublicId(storagePath);
  if (!publicId) return false;
  const values = config();
  const signed = {
    invalidate: "true",
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
  const form = new FormData();
  Object.entries(signed).forEach(([key, value]) => form.set(key, value));
  form.set("api_key", values.apiKey);
  form.set("signature", signature(signed, values.apiSecret));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(values.cloudName)}/image/destroy`,
    {
      method: "POST",
      body: form,
    },
  );
  if (!response.ok)
    throw new AppError(
      "CLOUDINARY_DELETE_FAILED",
      "Foto gagal dihapus dari Cloudinary.",
      undefined,
      502,
    );
  return true;
}

export function cloudinaryPublicId(storagePath: string) {
  return storagePath.startsWith(STORAGE_PREFIX)
    ? storagePath.slice(STORAGE_PREFIX.length)
    : null;
}

export function cloudinaryDeliveryUrl(storagePath: string) {
  const publicId = cloudinaryPublicId(storagePath);
  if (!publicId) return null;
  const values = config();
  const path = publicId.split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(values.cloudName)}/image/upload/${path}`;
}
