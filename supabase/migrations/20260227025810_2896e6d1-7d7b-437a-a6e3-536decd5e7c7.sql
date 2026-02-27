
-- Subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Editions table (stores processed boletín editions)
CREATE TABLE public.editions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_date DATE NOT NULL UNIQUE,
  raw_content JSONB,
  summary_content JSONB,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  subscribers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (insert)
CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT WITH CHECK (true);

-- Public can read their own subscription by unsubscribe_token (for unsubscribe page)
CREATE POLICY "Anyone can read by unsubscribe_token" ON public.subscribers
  FOR SELECT USING (true);

-- Public can update their own subscription (unsubscribe)
CREATE POLICY "Anyone can unsubscribe by token" ON public.subscribers
  FOR UPDATE USING (true);

-- Editions are public read
CREATE POLICY "Editions are publicly readable" ON public.editions
  FOR SELECT USING (true);

-- Service role handles inserts/updates to editions (via edge functions)

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
