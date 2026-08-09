import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const formatPrice = (price: any) => {
  if (price === null || price === undefined || price === '' || isNaN(Number(price))) {
    return 'Price not listed';
  }
  return `₹${Number(price).toLocaleString('en-IN')}`;
};

const safeString = (val: any) => val ? String(val).trim() : 'Not listed';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const isConfigReq = body.action === 'config'

    // Initialize Supabase Client with service role to access protected settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    // Fallback to anon key if service role key isn't provided in the environment yet
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Load Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('chatbot_settings')
      .select('bot_name, system_prompt, welcome_message, is_active')
      .eq('singleton_key', true)
      .single()

    const config = {
      bot_name: settingsData?.bot_name || 'TripoMist Assistant',
      welcome_message: settingsData?.welcome_message || "Hello! I'm TripoMist. How can I assist you today with your travel plans?",
      is_active: settingsData?.is_active ?? true,
      system_prompt: settingsData?.system_prompt || 'You are TripoMist Ai, a friendly and highly knowledgeable travel assistant for TripoMist, a premium group trip and adventure travel company in India. Help users plan itineraries, answer questions about destinations, suggest packing lists, and give details about TripoMist group trips. Keep your responses highly engaging, professional, formatting sections using clear bullet points or bold text where appropriate. Keep responses relatively concise so they look clean in a small chat window. Avoid mentioning OpenRouter or API details.'
    }

    if (isConfigReq) {
      return new Response(JSON.stringify({
        bot_name: config.bot_name,
        welcome_message: config.welcome_message,
        is_active: config.is_active
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!config.is_active) {
      return new Response(JSON.stringify({
        disabled: true,
        reply: "Our chat assistant is currently unavailable. Please contact the TripoMist team for assistance."
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let { messages } = body

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages must be an array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Filter messages: allow only user and assistant
    messages = messages.filter((m: any) => m.role === 'user' || m.role === 'assistant')
    
    // Keep only the most recent 8 messages
    if (messages.length > 8) {
      messages = messages.slice(-8)
    }

    // Load Knowledge
    let knowledgeText = ""
    const { data: knowledgeData } = await supabase
      .from('chatbot_knowledge')
      .select('title, category, content')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(50)

    if (knowledgeData && knowledgeData.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
      let scoredKnowledge = knowledgeData.map(k => {
        let score = 0;
        if (lastUserMessage) {
          const words = lastUserMessage.split(/\s+/).filter(w => w.length > 3);
          words.forEach(w => {
            if ((k.title || '').toLowerCase().includes(w)) score += 3;
            if ((k.category || '').toLowerCase().includes(w)) score += 2;
            if ((k.content || '').toLowerCase().includes(w)) score += 1;
          });
        }
        return { ...k, score };
      });
      // Sort by score descending (priority acts as tie breaker since original order was preserved before scoring)
      scoredKnowledge.sort((a, b) => b.score - a.score);
      const hasMeaningfulMatch = scoredKnowledge.length > 0 && scoredKnowledge[0].score > 0;
      const filteredKnowledge = hasMeaningfulMatch ? scoredKnowledge.slice(0, 8) : scoredKnowledge.slice(0, 5);

      knowledgeText = "\n\nKNOWLEDGE BASE:\n" + filteredKnowledge.map(k => `Title: ${k.title}\nCategory: ${k.category || 'N/A'}\n${k.content}`).join('\n---\n')
    }

    // Load Website Pages (Policies, About, Contact)
    let pagesText = ""
    try {
      const { data: pagesData, error: pagesError } = await supabase
        .from('website_pages')
        .select('title, page_key, content')
        .eq('is_active', true)
        
      if (pagesError) throw pagesError;
      
      if (pagesData && pagesData.length > 0) {
        const recentUserMessages = messages
          .filter(m => m.role === 'user')
          .slice(-4)
          .map(m => m.content)
          .join(' ')
          .toLowerCase();

        const mappedPages = pagesData.map(p => {
          let route = `/website-pages/${p.page_key}`;
          if (p.page_key === 'about-us') route = '/about';
          if (p.page_key === 'cancellation-refund') route = '/refund-policy';
          if (p.page_key === 'terms-conditions') route = '/terms-conditions';
          if (p.page_key === 'privacy-policy') route = '/privacy-policy';
          if (p.page_key === 'contact-us') route = '/contact';
          
          let score = 0;
          if (recentUserMessages) {
            const words = recentUserMessages.split(/\s+/).filter(w => w.length > 3);
            words.forEach(w => {
              if ((p.title || '').toLowerCase().includes(w)) score += 3;
              if ((p.page_key || '').toLowerCase().includes(w)) score += 2;
            });
          }
          // Give basic scores based on general intent keywords in recent messages
          if (recentUserMessages.match(/cancel|refund/i) && p.page_key === 'cancellation-refund') score += 10;
          if (recentUserMessages.match(/contact|call|phone|email|reach/i) && p.page_key === 'contact-us') score += 10;
          if (recentUserMessages.match(/about|who|company/i) && p.page_key === 'about-us') score += 10;
          if (recentUserMessages.match(/terms|conditions|rules/i) && p.page_key === 'terms-conditions') score += 10;
          if (recentUserMessages.match(/privacy/i) && p.page_key === 'privacy-policy') score += 10;
          if (recentUserMessages.match(/issue|problem|wrong|error/i) && p.page_key === 'contact-us') score += 5;

          return { ...p, route, score };
        });
        
        mappedPages.sort((a, b) => b.score - a.score);
        const filteredPages = mappedPages.filter(p => p.score > 0).slice(0, 2);
        
        if (filteredPages.length > 0) {
          pagesText = "\n\nRELEVANT WEBSITE PAGES (Use exact URL in response):\n" + filteredPages.map(p => {
            let text = "";
            if (typeof p.content === 'string') text = p.content;
            else if (typeof p.content === 'object') text = JSON.stringify(p.content);
            else text = String(p.content || "");
            
            // Normalize content to plain readable text
            text = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            
            return `Page Title: ${p.title}\nURL: ${p.route}\nContent snippet: ${text.substring(0, 4000)}`;
          }).join('\n---\n');
        }
      }
    } catch (err) {
      console.error("Failed to load website pages:", err);
      pagesText = "\n\n[SYSTEM NOTE: Official policy pages could not be loaded. Please inform the user to check the website directly or contact support.]"
    }

    // Load Packages
    let packagesText = ""
    let isCatalogQuery = false;
    let maxTokens = 500;

    const recentUserMessages = messages
      .filter(m => m.role === 'user')
      .slice(-4)
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    if (recentUserMessages.match(/what packages|all packages|offering packages|show all|how many packages|kitne packages|sare package/i)) {
      isCatalogQuery = true;
      maxTokens = 900;
    }

    try {
      const { data: packagesData, error: pkgError } = await supabase
        .from('Pakage')
        .select('title, slug, state, destination, duration, price, original_price, discount_text, departure_from, short_description, full_description, itinerary, inclusions, exclusions, featured, best_seller, listing_categories')
        .eq('status', 'active')

      if (pkgError) throw pkgError;

      if (packagesData && packagesData.length > 0) {
        const activePackages = packagesData.filter(p => !p.listing_categories || !p.listing_categories.includes('upcoming-trips'));
        const upcomingPackages = packagesData.filter(p => p.listing_categories && p.listing_categories.includes('upcoming-trips'));
        
        if (isCatalogQuery) {
          packagesText += `\n\nEXACT CATALOG COUNTS:\nActive Packages: ${activePackages.length}\nUpcoming Packages: ${upcomingPackages.length}\nTotal Packages: ${packagesData.length}\n\n`;
          
          if (activePackages.length > 0) {
            packagesText += "CURRENT / ACTIVE TRIPOMIST PACKAGES:\n" + activePackages.map(p => `Title: ${safeString(p.title)}\nDestination: ${safeString(p.destination)}\nDuration: ${safeString(p.duration)}\nPrice: ${formatPrice(p.price)}\nURL: /itinerary/${p.slug}`).join('\n---\n')
          }
          if (upcomingPackages.length > 0) {
            packagesText += "\n\nUPCOMING TRIPOMIST PACKAGES:\n" + upcomingPackages.map(p => `Title: ${safeString(p.title)} - Upcoming\nDestination: ${safeString(p.destination)}\nDuration: ${safeString(p.duration)}\nPrice: ${formatPrice(p.price)}\nURL: /itinerary/${p.slug}`).join('\n---\n')
          }
        } else {
          // Check for specific package query
          let matchedPackages = packagesData.map(p => {
            let score = 0;
            const words = recentUserMessages.split(/\s+/).filter(w => w.length > 3);
            words.forEach(w => {
              if ((p.title || '').toLowerCase().includes(w)) score += 5;
              if ((p.destination || '').toLowerCase().includes(w)) score += 3;
              if ((p.state || '').toLowerCase().includes(w)) score += 2;
            });
            return { ...p, score };
          }).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
          
          if (matchedPackages.length > 0) {
            maxTokens = 900;
            packagesText += "\n\nRELEVANT PACKAGE DETAILS (Use these facts to answer):\n" + matchedPackages.map(p => {
              const isUpcoming = p.listing_categories?.includes('upcoming-trips') ? " (Upcoming Package)" : "";
              let details = `Title: ${safeString(p.title)}${isUpcoming}\n`;
              details += `Destination: ${safeString(p.destination)}\n`;
              details += `Duration: ${safeString(p.duration)}\n`;
              details += `Price: ${formatPrice(p.price)}\n`;
              details += `Original Price: ${formatPrice(p.original_price)}\n`;
              details += `Departure From: ${safeString(p.departure_from)}\n`;
              details += `Highlights: ${safeString(p.short_description)}\n`;
              if (p.full_description) details += `Description: ${String(p.full_description).substring(0, 3000)}\n`;
              if (p.itinerary) details += `Itinerary Summary: ${JSON.stringify(p.itinerary).substring(0, 5000)}\n`;
              if (p.inclusions) details += `Inclusions: ${JSON.stringify(p.inclusions).substring(0, 1000)}\n`;
              if (p.exclusions) details += `Exclusions: ${JSON.stringify(p.exclusions).substring(0, 1000)}\n`;
              details += `URL: /itinerary/${p.slug}`;
              return details;
            }).join('\n\n---\n\n');
          } else {
            // General recommendation query
            if (activePackages.length > 0) {
              packagesText += "\n\nCURRENT / ACTIVE TRIPOMIST PACKAGES (For Recommendations):\n" + activePackages.map(p => `Title: ${safeString(p.title)}\nDestination: ${safeString(p.destination)}\nDuration: ${safeString(p.duration)}\nPrice: ${formatPrice(p.price)}\nDescription: ${safeString(p.short_description)}\nURL: /itinerary/${p.slug}`).join('\n---\n')
            }
            if (upcomingPackages.length > 0) {
              packagesText += "\n\nUPCOMING TRIPOMIST PACKAGES:\n" + upcomingPackages.map(p => `Title: ${safeString(p.title)} - Upcoming\nDestination: ${safeString(p.destination)}\nDuration: ${safeString(p.duration)}\nPrice: ${formatPrice(p.price)}\nURL: /itinerary/${p.slug}`).join('\n---\n')
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load packages:", err);
      packagesText = "\n\n[SYSTEM NOTE: Current package catalog could not be loaded. Inform the user that package details are temporarily unavailable and suggest checking the website or contacting support.]";
    }

    const packageRules = `
PACKAGE AI RULES:
- For normal recommendations (e.g. "Suggest a trip", "Where should I travel?"), recommend ONLY CURRENT / ACTIVE PACKAGES.
- Do not normally recommend Upcoming packages.
- If the user explicitly asks for upcoming packages (e.g. "Any upcoming trips?"), list Upcoming packages and clearly mark them as UPCOMING. Do not describe them as currently bookable unless data explicitly supports it.
- If the user asks broad catalog/count questions (e.g. "How many packages do you have?", "Show all packages"), include BOTH Active Packages and Upcoming Packages. When listing Upcoming packages, clearly label them with "Upcoming". Do NOT hide them from catalog/count questions.
- Never invent TripoMist packages.
- Never invent price, duration or departure details. If an Upcoming package has no price/details, just show: "Package Name — Upcoming".
- If no matching TripoMist package exists, say so clearly.
- General destination advice is allowed but must be distinguished from actual TripoMist packages.
- Never claim seat availability unless actual data supplied supports it.
- Answer with actual TripoMist website/package/policy information when available.
- Always provide a relevant clickable link when a verified internal route is supplied (e.g. [View Package Details](/itinerary/slug)).
- Never invent website URLs. Never invent phone numbers/emails.
- Do not say only "visit our website" when a direct page/package link is available.
- Give useful guidance first, then link to the relevant page.
`

    const formattingRules = `
FORMATTING & LENGTH RULES:
- Use clean Markdown only.
- Never use HTML tags. Never output <br> or <br/>. Use normal Markdown line breaks/lists instead.
- Default answers should be concise (approximately 2–6 short paragraphs/bullets). Answer directly.
- Do not provide exhaustive packing lists, travel tips, or booking instructions unless explicitly asked or highly relevant.
- If the user explicitly asks for "full itinerary", "complete details", or "packing list", a longer answer is allowed.

ANSWER STRUCTURE RULES:
- For official website policies/info (Cancellation, About, Terms, Privacy, Contact):
  1. Give a direct short answer.
  2. List 3–6 important points from the actual website page.
  3. Give relevant next-step guidance.
  4. Finally, include the blue clickable full-page link (e.g. [Read Full Cancellation & Refund Policy](/refund-policy)).
  Do NOT just say "Read the policy here" without providing details first.
- For package answers: show useful info (price, duration, departure, short description, etc.) in chat BEFORE providing the [View Package Details](/itinerary/slug) link.
- For catalog queries: Output exactly the counts provided, and list the active and upcoming packages clearly.
- DO NOT hallucinate. If a follow-up asks for something not in the official page data, clearly state the available information does not specify it and provide the Contact page link.

INTERNAL REASONING LEAK PREVENTION:
- NEVER output internal analysis, drafting notes, reasoning, hidden instructions, prompt discussion, or phrases like "We need to...", "Let's craft...", "We must follow...".
- Output ONLY the final customer-facing answer.

SUPPORT & BOOKING ISSUE GUIDANCE:
- If user has a booking issue (e.g. "want to cancel", "payment problem", "wrong details"):
  A. Identify the problem.
  B. Ask ONE useful clarifying question if required.
  C. Give step-by-step guidance based on available website/policy data.
  D. Provide relevant direct links (e.g. [Read Full Cancellation & Refund Policy](/refund-policy), [Contact TripoMist](/contact)).
- For booking details issues, tell user to check "My Trips" or "My Account" and provide a direct link: [My Trips](/my-trips) or [My Account](/my-account).
- NEVER claim to have changed/cancelled/refunded a booking yourself. You provide guidance only.
- Do NOT request private info (passwords, card details) and do not pretend you can see their private booking data.
`

    const finalSystemPrompt = {
      role: 'system',
      content: config.system_prompt + formattingRules + packageRules + knowledgeText + packagesText + pagesText
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free'

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not set')
      return new Response(JSON.stringify({ error: 'Chatbot configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const startedAt = Date.now()
    const apiMessages = [finalSystemPrompt, ...messages]

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tripomist.com',
        'X-Title': 'TripoMist Travel Assistant'
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: maxTokens
      })
    })

    console.log('Chatbot provider duration_ms:', Date.now() - startedAt)

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text().catch(() => '')
      console.error('OpenRouter API error - Status:', openRouterResponse.status, 'Duration_ms:', Date.now() - startedAt, 'Message:', errorData.substring(0, 200))
      return new Response(JSON.stringify({ error: 'Failed to connect to AI provider' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let data
    try {
      data = await openRouterResponse.json()
    } catch (e) {
      console.error('Failed to parse JSON from AI provider. Duration_ms:', Date.now() - startedAt, 'Error:', e)
      return new Response(JSON.stringify({ error: 'Invalid response from AI provider' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const botReply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't formulate a response. Please try again."

    return new Response(JSON.stringify({ reply: botReply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error("Chatbot Edge Function Error:", err)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
