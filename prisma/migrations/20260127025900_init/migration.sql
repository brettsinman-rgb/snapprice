-- CreateTable
CREATE TABLE "SearchSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SearchResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "image" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "shippingPrice" REAL,
    "condition" TEXT,
    "availability" TEXT,
    "productUrl" TEXT NOT NULL,
    "matchScore" REAL NOT NULL,
    "rawProvider" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    CONSTRAINT "SearchResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SearchSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClickEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    CONSTRAINT "ClickEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SearchSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClickEvent_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "SearchResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SearchResult_sessionId_idx" ON "SearchResult"("sessionId");

-- CreateIndex
CREATE INDEX "ClickEvent_sessionId_idx" ON "ClickEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ClickEvent_resultId_idx" ON "ClickEvent"("resultId");
