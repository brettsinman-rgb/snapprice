import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'torque-autopart-uploads';

export async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const path = `uploads/${filename}`;
  const { error } = await client.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) return null;

  const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
}
