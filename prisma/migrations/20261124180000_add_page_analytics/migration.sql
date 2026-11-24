CREATE TABLE "page_analytics" (
  "day" DATE NOT NULL,
  "path" VARCHAR(240) NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "source" VARCHAR(100) NOT NULL,
  "screen" VARCHAR(8) NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "visits" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "page_analytics_pkey" PRIMARY KEY ("day", "path", "country", "source", "screen")
);
