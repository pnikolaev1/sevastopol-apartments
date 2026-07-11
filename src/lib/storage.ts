import { createClient } from "@supabase/supabase-js";

const BUCKET = "apartment-photos";

/**
 * Supabase project URL: prefer SUPABASE_URL, otherwise derive the project ref
 * from the pooler DATABASE_URL username (postgres.<ref>@...), which is always
 * present since the app can't run without a database.
 */
function getSupabaseUrl(): string {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  const m = process.env.DATABASE_URL?.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/);
  if (!m) throw new Error("Set SUPABASE_URL — cannot derive the project ref from DATABASE_URL");
  return `https://${m[1]}.supabase.co`;
}

function getStorageClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local and Vercel (Supabase dashboard → Project Settings → API)"
    );
  }
  return createClient(getSupabaseUrl(), key, { auth: { persistSession: false } });
}

let bucketReady = false;

async function ensureBucket(client: ReturnType<typeof getStorageClient>) {
  if (bucketReady) return;
  const { data } = await client.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true });
    // Race with a parallel upload creating it is fine; anything else is not.
    if (error && !`${error.message}`.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to create storage bucket: ${error.message}`);
    }
  }
  bucketReady = true;
}

/** Uploads a processed image and returns its public URL. */
export async function uploadApartmentPhoto(
  path: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getStorageClient();
  await ensureBucket(client);
  const { error } = await client.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Deletes a photo from storage if its URL lives in our bucket (repo-hosted
 *  photos under /images/... are left alone). */
export async function deleteApartmentPhoto(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length));
  const client = getStorageClient();
  await client.storage.from(BUCKET).remove([path]);
}
