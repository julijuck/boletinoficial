CREATE TABLE public.norm_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_token uuid NOT NULL,
  edition_date date,
  category text,
  organism text,
  title text,
  url text NOT NULL,
  vote smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscriber_token, url)
);
GRANT ALL ON public.norm_feedback TO service_role;
ALTER TABLE public.norm_feedback ENABLE ROW LEVEL SECURITY;