/**
 * Pluggable file storage for generated PDFs (itineraries, invoices, vouchers).
 *
 * Driver is chosen from STORAGE_DRIVER:
 *   "supabase" - Supabase Storage (recommended alongside a Supabase Postgres)
 *   "s3"       - any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2, MinIO)
 *   "local"    - writes to ./public/generated (DEV ONLY)
 *
 * IMPORTANT for Railway/Vercel: the "local" driver does NOT survive a redeploy or a
 * container restart — those filesystems are ephemeral. Use supabase or s3 in production.
 * If STORAGE_DRIVER is unset in production, uploads are skipped and the PDF is still
 * streamed to the user, so document generation never hard-fails on a storage misconfig.
 */

export type StoredFile = { url: string; key: string; driver: string };

function getDriver(): "supabase" | "s3" | "local" | "none" {
  const raw = (process.env.STORAGE_DRIVER || "").toLowerCase();
  if (raw === "supabase" || raw === "s3" || raw === "local") return raw;
  return process.env.NODE_ENV === "production" ? "none" : "local";
}

/**
 * Upload a PDF and return its retrievable URL, or null if storage is not configured.
 * Never throws — callers should still be able to serve the generated file.
 */
export async function uploadPdf(key: string, body: Buffer): Promise<StoredFile | null> {
  const driver = getDriver();

  try {
    if (driver === "supabase") return await uploadToSupabase(key, body);
    if (driver === "s3") return await uploadToS3(key, body);
    if (driver === "local") return await uploadToLocal(key, body);
    return null;
  } catch (err) {
    console.error(`[storage] upload failed (driver=${driver}, key=${key}):`, err);
    return null;
  }
}

async function uploadToSupabase(key: string, body: Buffer): Promise<StoredFile> {
  const url = process.env.SUPABASE_URL;
  // Must be the SERVICE ROLE key — the anon key cannot write to a private bucket.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "documents";

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the supabase storage driver");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { error } = await supabase.storage.from(bucket).upload(key, body, {
    contentType: "application/pdf",
    upsert: true, // regenerating an itinerary should overwrite, not error
  });

  if (error) throw error;

  // Signed URL so documents in a private bucket stay private.
  const expiresIn = Number(process.env.STORAGE_SIGNED_URL_TTL || 60 * 60 * 24 * 7); // 7 days
  const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(key, expiresIn);
  if (signErr) throw signErr;

  return { url: signed.signedUrl, key, driver: "supabase" };
}

async function uploadToS3(key: string, body: Buffer): Promise<StoredFile> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "us-east-1";
  const endpoint = process.env.S3_ENDPOINT; // set for R2/B2/MinIO; omit for AWS

  if (!bucket) throw new Error("S3_BUCKET is required for the s3 storage driver");

  const { S3Client, PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });

  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "application/pdf" })
  );

  const expiresIn = Number(process.env.STORAGE_SIGNED_URL_TTL || 60 * 60 * 24 * 7);
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });

  return { url, key, driver: "s3" };
}

async function uploadToLocal(key: string, body: Buffer): Promise<StoredFile> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const target = path.join(process.cwd(), "public", "generated", key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);

  return { url: `/generated/${key}`, key, driver: "local" };
}
