-- CreateEnum
CREATE TYPE "jurisdiction_type" AS ENUM ('STATE', 'COUNTY', 'CITY');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'CLIENT');

-- CreateTable
CREATE TABLE "cities" (
    "id" BIGSERIAL NOT NULL,
    "state_code" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" BIGSERIAL NOT NULL,
    "jurisdiction_type" "jurisdiction_type" NOT NULL,
    "state_code" TEXT NOT NULL,
    "county_name" TEXT,
    "city_id" BIGINT,
    "rate" DECIMAL(10,6) NOT NULL,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" BIGINT,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zip_cities" (
    "zip" TEXT NOT NULL,
    "city_id" BIGINT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "zip_cities_pkey" PRIMARY KEY ("zip","city_id")
);

-- CreateTable
CREATE TABLE "zip_codes" (
    "zip" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "county_name" TEXT NOT NULL,
    "primary_city_name" TEXT,

    CONSTRAINT "zip_codes_pkey" PRIMARY KEY ("zip")
);

-- CreateIndex
CREATE INDEX "idx_cities_state" ON "cities"("state_code");

-- CreateIndex
CREATE UNIQUE INDEX "cities_state_city_uniq" ON "cities"("state_code", "city_name");

-- CreateIndex
CREATE UNIQUE INDEX "ux_tax_rates_identity_start" ON "tax_rates"("jurisdiction_type", "state_code", "county_name", "city_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_zip_cities_city_id" ON "zip_cities"("city_id");

-- CreateIndex
CREATE INDEX "idx_zip_codes_state_county" ON "zip_codes"("state_code", "county_name");

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zip_cities" ADD CONSTRAINT "zip_cities_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zip_cities" ADD CONSTRAINT "zip_cities_zip_fkey" FOREIGN KEY ("zip") REFERENCES "zip_codes"("zip") ON DELETE CASCADE ON UPDATE NO ACTION;
