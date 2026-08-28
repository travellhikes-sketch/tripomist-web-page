// supabase/functions/instagram-follower-count/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};
var memoryCache = null;
var CACHE_DURATION_MS = 15 * 60 * 1e3;
function formatFollowers(count) {
  if (count >= 1e6) {
    const val = count / 1e6;
    return `${val.toFixed(val % 1 === 0 ? 0 : 1)}m`;
  }
  if (count >= 1e3) {
    const val = count / 1e3;
    return `${val.toFixed(val % 1 === 0 ? 0 : 1)}k`;
  }
  return count.toString();
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const now = Date.now();
    if (memoryCache && now - memoryCache.timestamp < CACHE_DURATION_MS) {
      return new Response(
        JSON.stringify({
          followerCount: memoryCache.followerCount,
          formattedFollowerCount: memoryCache.formattedFollowerCount,
          source: "instagram"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const instagramUserId = Deno.env.get("INSTAGRAM_IG_USER_ID") || "";
    const accessToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN") || "";
    if (!instagramUserId || !accessToken) {
      console.warn("Instagram Graph credentials are not set in Deno environment");
      return new Response(
        JSON.stringify({
          followerCount: 0,
          formattedFollowerCount: "",
          source: "fallback"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${instagramUserId}?fields=followers_count&access_token=${accessToken}`
    );
    if (!response.ok) {
      console.warn("Instagram Graph API request failed");
      return new Response(
        JSON.stringify({
          followerCount: 0,
          formattedFollowerCount: "",
          source: "fallback"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const data = await response.json();
    const rawCount = data.followers_count;
    if (typeof rawCount === "number") {
      const formatted = formatFollowers(rawCount);
      memoryCache = {
        followerCount: rawCount,
        formattedFollowerCount: formatted,
        timestamp: now
      };
      return new Response(
        JSON.stringify({
          followerCount: rawCount,
          formattedFollowerCount: formatted,
          source: "instagram"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        followerCount: 0,
        formattedFollowerCount: "",
        source: "fallback"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error executing fetch:", err);
    return new Response(
      JSON.stringify({
        followerCount: 0,
        formattedFollowerCount: "",
        source: "fallback"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
