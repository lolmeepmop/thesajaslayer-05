import { supabase } from "@/integrations/supabase/client";

export type PlayEventName = 'game_start' | 'game_end';

const SESSION_KEY = 'play_session_id';

export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Fallback if storage is unavailable
    return Math.random().toString(36).slice(2);
  }
}

export async function trackPlayEvent(
  event: PlayEventName,
  details: { mode?: string; stage?: string; difficulty?: string } = {}
) {
  try {
    const session_id = getSessionId();
    const user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    await supabase.from('play_events').insert({
      session_id,
      event,
      mode: details.mode,
      stage: details.stage,
      difficulty: details.difficulty,
      user_agent,
      referrer,
    });
  } catch (e) {
    // Never block gameplay if analytics fail
    console.warn('trackPlayEvent failed', e);
  }
}
