/**
 * Notes data service using Supabase.
 * Provides CRUD functions targeting a 'notes' table:
 *   columns: id (uuid), title (text), content (text), created_at (timestamp)
 *
 * All functions:
 * - return { data, error } to allow callers to branch on success/failure.
 * - handle missing Supabase env config without throwing (error surfaced in result).
 * - include schema-not-found hints for easier setup.
 */

// PUBLIC_INTERFACE
/**
 * getNotes fetches notes ordered by created_at descending.
 * @returns {Promise<{data: any[]|null, error: Error|null}>}
 */
import { getSupabaseClient } from '../lib/supabaseClient';

// Shared helper to produce standard error responses
function makeError(message, meta = {}) {
  const err = new Error(message);
  Object.assign(err, meta);
  return err;
}

function missingClientResult() {
  return {
    data: null,
    error: makeError(
      'Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your environment.',
      { code: 'NO_SUPABASE_CLIENT' }
    ),
  };
}

function maybeSchemaHint(errorMessage) {
  // Provide hints if a missing table error occurs
  const hint =
    "If the 'notes' table does not exist, create it in Supabase:\n" +
    "  create table if not exists public.notes (\n" +
    "    id uuid primary key default gen_random_uuid(),\n" +
    "    title text not null,\n" +
    "    content text not null,\n" +
    "    created_at timestamp with time zone default timezone('utc'::text, now()) not null\n" +
    "  );";
  return `${errorMessage}\n${hint}`;
}

// PUBLIC_INTERFACE
export async function getNotes() {
  /** Fetch all notes ordered by created_at desc */
  const supabase = getSupabaseClient();
  if (!supabase) return missingClientResult();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const msg =
      error?.message?.toLowerCase().includes('relation') &&
      error?.message?.toLowerCase().includes('does not exist')
        ? maybeSchemaHint('Failed to fetch notes: table "notes" not found.')
        : `Failed to fetch notes: ${error.message}`;
    return { data: null, error: makeError(msg, { cause: error }) };
  }
  return { data, error: null };
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a new note with title and content. */
  const supabase = getSupabaseClient();
  if (!supabase) return missingClientResult();

  if (!title || !content) {
    return { data: null, error: makeError('Title and content are required.') };
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, content }])
    .select()
    .single();

  if (error) {
    const msg =
      error?.message?.toLowerCase().includes('relation') &&
      error?.message?.toLowerCase().includes('does not exist')
        ? maybeSchemaHint('Failed to create note: table "notes" not found.')
        : `Failed to create note: ${error.message}`;
    return { data: null, error: makeError(msg, { cause: error }) };
  }
  return { data, error: null };
}

// PUBLIC_INTERFACE
export async function updateNote(id, { title, content }) {
  /** Update an existing note by id. Provide title/content fields to update. */
  const supabase = getSupabaseClient();
  if (!supabase) return missingClientResult();

  if (!id) return { data: null, error: makeError('Note id is required.') };
  const updatePayload = {};
  if (typeof title === 'string') updatePayload.title = title;
  if (typeof content === 'string') updatePayload.content = content;

  if (Object.keys(updatePayload).length === 0) {
    return { data: null, error: makeError('Nothing to update.') };
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const msg =
      error?.message?.toLowerCase().includes('relation') &&
      error?.message?.toLowerCase().includes('does not exist')
        ? maybeSchemaHint('Failed to update note: table "notes" not found.')
        : `Failed to update note: ${error.message}`;
    return { data: null, error: makeError(msg, { cause: error }) };
  }
  return { data, error: null };
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. */
  const supabase = getSupabaseClient();
  if (!supabase) return missingClientResult();

  if (!id) return { data: null, error: makeError('Note id is required.') };

  const { data, error } = await supabase.from('notes').delete().eq('id', id).select().single();

  if (error) {
    const msg =
      error?.message?.toLowerCase().includes('relation') &&
      error?.message?.toLowerCase().includes('does not exist')
        ? maybeSchemaHint('Failed to delete note: table "notes" not found.')
        : `Failed to delete note: ${error.message}`;
    return { data: null, error: makeError(msg, { cause: error }) };
  }
  return { data, error: null };
}
