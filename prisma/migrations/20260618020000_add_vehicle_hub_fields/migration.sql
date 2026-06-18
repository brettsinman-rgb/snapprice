-- Extend Saved Garage for Vehicle Hub.
ALTER TABLE "GarageVehicle" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "GarageVehicle" ADD COLUMN IF NOT EXISTS "vehicleSlug" TEXT;

CREATE INDEX IF NOT EXISTS "GarageVehicle_vehicleSlug_idx" ON "GarageVehicle"("vehicleSlug");

CREATE TABLE IF NOT EXISTS "VehicleSearch" (
    "id" TEXT NOT NULL,
    "garageVehicleId" TEXT NOT NULL,
    "searchSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleSearch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VehiclePriceAlert" (
    "id" TEXT NOT NULL,
    "garageVehicleId" TEXT NOT NULL,
    "priceAlertId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VehicleSearch_garageVehicleId_idx" ON "VehicleSearch"("garageVehicleId");
CREATE INDEX IF NOT EXISTS "VehicleSearch_searchSessionId_idx" ON "VehicleSearch"("searchSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "VehicleSearch_garageVehicleId_searchSessionId_key" ON "VehicleSearch"("garageVehicleId", "searchSessionId");

CREATE INDEX IF NOT EXISTS "VehiclePriceAlert_garageVehicleId_idx" ON "VehiclePriceAlert"("garageVehicleId");
CREATE INDEX IF NOT EXISTS "VehiclePriceAlert_priceAlertId_idx" ON "VehiclePriceAlert"("priceAlertId");
CREATE UNIQUE INDEX IF NOT EXISTS "VehiclePriceAlert_garageVehicleId_priceAlertId_key" ON "VehiclePriceAlert"("garageVehicleId", "priceAlertId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleSearch_garageVehicleId_fkey') THEN
    ALTER TABLE "VehicleSearch"
    ADD CONSTRAINT "VehicleSearch_garageVehicleId_fkey"
    FOREIGN KEY ("garageVehicleId") REFERENCES "GarageVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleSearch_searchSessionId_fkey') THEN
    ALTER TABLE "VehicleSearch"
    ADD CONSTRAINT "VehicleSearch_searchSessionId_fkey"
    FOREIGN KEY ("searchSessionId") REFERENCES "SearchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehiclePriceAlert_garageVehicleId_fkey') THEN
    ALTER TABLE "VehiclePriceAlert"
    ADD CONSTRAINT "VehiclePriceAlert_garageVehicleId_fkey"
    FOREIGN KEY ("garageVehicleId") REFERENCES "GarageVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehiclePriceAlert_priceAlertId_fkey') THEN
    ALTER TABLE "VehiclePriceAlert"
    ADD CONSTRAINT "VehiclePriceAlert_priceAlertId_fkey"
    FOREIGN KEY ("priceAlertId") REFERENCES "PriceAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
