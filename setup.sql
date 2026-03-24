-- 0. Create User table (Matches Supabase Auth)
CREATE TABLE IF NOT EXISTS public."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"("email");

-- 1. Create SearchSession table
CREATE TABLE IF NOT EXISTS public."SearchSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "query" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "status" TEXT NOT NULL,
    CONSTRAINT "SearchSession_pkey" PRIMARY KEY ("id")
);

-- Ensure userId column exists if table was created previously
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SearchSession' AND column_name='userId') THEN
        ALTER TABLE public."SearchSession" ADD COLUMN "userId" TEXT;
    END IF;
END $$;

-- 2. Create SearchResult table
CREATE TABLE IF NOT EXISTS public."SearchResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "image" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "shippingPrice" DOUBLE PRECISION,
    "condition" TEXT,
    "availability" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "marketplace" TEXT,
    "productUrl" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "rawProvider" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    CONSTRAINT "SearchResult_pkey" PRIMARY KEY ("id")
);

-- 3. Create ClickEvent table
CREATE TABLE IF NOT EXISTS public."ClickEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- 4. Create Indexes for performance (CRITICAL FOR HISTORY PAGE)
CREATE INDEX IF NOT EXISTS "SearchSession_userId_idx" ON public."SearchSession"("userId");
CREATE INDEX IF NOT EXISTS "SearchSession_status_idx" ON public."SearchSession"("status");
CREATE INDEX IF NOT EXISTS "SearchResult_sessionId_idx" ON public."SearchResult"("sessionId");
CREATE INDEX IF NOT EXISTS "ClickEvent_sessionId_idx" ON public."ClickEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "ClickEvent_resultId_idx" ON public."ClickEvent"("resultId");

-- 5. Add Foreign Key constraints (with safety checks)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='SearchSession_userId_fkey') THEN
        ALTER TABLE public."SearchSession" ADD CONSTRAINT "SearchSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='SearchResult_sessionId_fkey') THEN
        ALTER TABLE public."SearchResult" ADD CONSTRAINT "SearchResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."SearchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='ClickEvent_sessionId_fkey') THEN
        ALTER TABLE public."ClickEvent" ADD CONSTRAINT "ClickEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."SearchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='ClickEvent_resultId_fkey') THEN
        ALTER TABLE public."ClickEvent" ADD CONSTRAINT "ClickEvent_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES public."SearchResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SearchSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SearchResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClickEvent" ENABLE ROW LEVEL SECURITY;

-- 7. Add Public Read Policies (Safety check for existing policies)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public read for User') THEN
        CREATE POLICY "Allow public read for User" ON public."User" FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public read for SearchSession') THEN
        CREATE POLICY "Allow public read for SearchSession" ON public."SearchSession" FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public read for SearchResult') THEN
        CREATE POLICY "Allow public read for SearchResult" ON public."SearchResult" FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public read for ClickEvent') THEN
        CREATE POLICY "Allow public read for ClickEvent" ON public."ClickEvent" FOR SELECT USING (true);
    END IF;
END $$;

-- 8. Add Public Insert/Update Policies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public insert for User') THEN
        CREATE POLICY "Allow public insert for User" ON public."User" FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public update for User') THEN
        CREATE POLICY "Allow public update for User" ON public."User" FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public insert for SearchSession') THEN
        CREATE POLICY "Allow public insert for SearchSession" ON public."SearchSession" FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public insert for SearchResult') THEN
        CREATE POLICY "Allow public insert for SearchResult" ON public."SearchResult" FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public insert for ClickEvent') THEN
        CREATE POLICY "Allow public insert for ClickEvent" ON public."ClickEvent" FOR INSERT WITH CHECK (true);
    END IF;
END $$;
