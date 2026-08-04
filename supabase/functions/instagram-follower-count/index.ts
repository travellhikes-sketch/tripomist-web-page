import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface CacheData {
  followerCount: number
  formattedFollowerCount: string
  timestamp: number
}

// In-memory cache in Deno warm instance scope (15 minutes)
let memoryCache: CacheData | null = null;
const CACHE_DURATION_MS = 15 * 60 * 1000;

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    const val = count / 1000000;
    return `${val.toFixed(val % 1 === 0 ? 0 : 1)}m`;
  }
  if (count >= 1000) {
    const val = count / 1000;
    return `${val.toFixed(val % 1 === 0 ? 0 : 1)}k`;
  }
  return count.toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check warm instance cache first
    const now = Date.now();
    if (memoryCache && (now - memoryCache.timestamp < CACHE_DURATION_MS)) {
      return new Response(
        JSON.stringify({
          followerCount: memoryCache.followerCount,
          formattedFollowerCount: memoryCache.formattedFollowerCount,
          source: 'instagram'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const instagramUserId = Deno.env.get('INSTAGRAM_IG_USER_ID') || '';
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN') || '';

    if (!instagramUserId || !accessToken) {
      console.warn('Instagram Graph credentials are not set in Deno environment');
      return new Response(
        JSON.stringify({
          followerCount: 0,
          formattedFollowerCount: '',
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call official Instagram Graph API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${instagramUserId}?fields=followers_count&access_token=${accessToken}`
    )

    if (!response.ok) {
      console.warn('Instagram Graph API request failed');
      return new Response(
        JSON.stringify({
          followerCount: 0,
          formattedFollowerCount: '',
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const rawCount = data.followers_count

    if (typeof rawCount === 'number') {
      const formatted = formatFollowers(rawCount)

      // Update memory cache
      memoryCache = {
        followerCount: rawCount,
        formattedFollowerCount: formatted,
        timestamp: now
      };

      return new Response(
        JSON.stringify({
          followerCount: rawCount,
          formattedFollowerCount: formatted,
          source: 'instagram'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        followerCount: 0,
        formattedFollowerCount: '',
        source: 'fallback'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error executing fetch:', err)
    return new Response(
      JSON.stringify({
        followerCount: 0,
        formattedFollowerCount: '',
        source: 'fallback'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
