-- Phase 2A: Chatbot Admin Knowledge Database

-- 1. CHATBOT SETTINGS
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton_key BOOLEAN NOT NULL DEFAULT true,
    bot_name TEXT NOT NULL DEFAULT 'TripoMist Assistant',
    system_prompt TEXT NOT NULL,
    welcome_message TEXT NOT NULL DEFAULT 'Hello! I''m TripoMist. How can I assist you today with your travel plans?',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chatbot_settings_singleton_chk CHECK (singleton_key = true)
);

-- Singleton constraint: maximum one settings row can exist
CREATE UNIQUE INDEX IF NOT EXISTS chatbot_settings_singleton_idx 
ON public.chatbot_settings (singleton_key);


-- 2. CHATBOT KNOWLEDGE
CREATE TABLE IF NOT EXISTS public.chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NULL,
    content TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NULL REFERENCES auth.users(id),
    updated_by UUID NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 3. RLS / SECURITY
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

-- Admins can manage chatbot_settings
CREATE POLICY "Admins can manage chatbot_settings"
    ON public.chatbot_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admins can manage chatbot_knowledge
CREATE POLICY "Admins can manage chatbot_knowledge"
    ON public.chatbot_knowledge
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Public is explicitly denied direct access via PostgREST. 
-- RLS default-deny behavior handles this. Edge Functions use service_role to bypass RLS.


-- 4. INITIAL SETTINGS ROW
INSERT INTO public.chatbot_settings (singleton_key, bot_name, system_prompt, welcome_message)
VALUES (
    true,
    'TripoMist Assistant',
    'You are TripoMist Ai, a friendly and highly knowledgeable travel assistant for TripoMist, a premium group trip and adventure travel company in India. Help users plan itineraries, answer questions about destinations, suggest packing lists, and give details about TripoMist group trips. Keep your responses highly engaging, professional, formatting sections using clear bullet points or bold text where appropriate. Keep responses relatively concise so they look clean in a small chat window. Avoid mentioning OpenRouter or API details.',
    'Hello! I''m TripoMist. How can I assist you today with your travel plans?'
)
ON CONFLICT (singleton_key) DO NOTHING;


-- 5. UPDATED_AT TRIGGERS
-- Trigger function for chatbot_settings
CREATE OR REPLACE FUNCTION public.set_chatbot_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chatbot_settings_updated_at ON public.chatbot_settings;
CREATE TRIGGER update_chatbot_settings_updated_at
    BEFORE UPDATE ON public.chatbot_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_chatbot_settings_updated_at();

-- Trigger function for chatbot_knowledge
CREATE OR REPLACE FUNCTION public.set_chatbot_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chatbot_knowledge_updated_at ON public.chatbot_knowledge;
CREATE TRIGGER update_chatbot_knowledge_updated_at
    BEFORE UPDATE ON public.chatbot_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION public.set_chatbot_knowledge_updated_at();
