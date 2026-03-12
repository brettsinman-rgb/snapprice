-- 1. Create SearchSession table
CREATE TABLE IF NOT EXISTS public."SearchSession" (
    "id" TEXT NOT NULL,
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

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS "SearchResult_sessionId_idx" ON public."SearchResult"("sessionId");
CREATE INDEX IF NOT EXISTS "ClickEvent_sessionId_idx" ON public."ClickEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "ClickEvent_resultId_idx" ON public."ClickEvent"("resultId");

-- 5. Add Foreign Key constraints
ALTER TABLE public."SearchResult" 
ADD CONSTRAINT "SearchResult_sessionId_fkey" 
FOREIGN KEY ("sessionId") REFERENCES public."SearchSession"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."ClickEvent" 
ADD CONSTRAINT "ClickEvent_sessionId_fkey" 
FOREIGN KEY ("sessionId") REFERENCES public."SearchSession"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."ClickEvent" 
ADD CONSTRAINT "ClickEvent_resultId_fkey" 
FOREIGN KEY ("resultId") REFERENCES public."SearchResult"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public."SearchSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SearchResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClickEvent" ENABLE ROW LEVEL SECURITY;

-- 7. Add Public Read Policies
CREATE POLICY "Allow public read for SearchSession" ON public."SearchSession" FOR SELECT USING (true);
CREATE POLICY "Allow public read for SearchResult" ON public."SearchResult" FOR SELECT USING (true);
CREATE POLICY "Allow public read for ClickEvent" ON public."ClickEvent" FOR SELECT USING (true);

-- 8. Add Public Insert Policies
CREATE POLICY "Allow public insert for SearchSession" ON public."SearchSession" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for SearchResult" ON public."SearchResult" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for ClickEvent" ON public."ClickEvent" FOR INSERT WITH CHECK (true);
