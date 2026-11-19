-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PROJECT', 'ARTICLE', 'COURSE', 'PATH', 'LESSON', 'DOWNLOAD', 'BOOK', 'GUIDE', 'ILLUSTRATION');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceAccess" AS ENUM ('PUBLIC', 'FREE_ACCOUNT', 'PAID');

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" VARCHAR(2000) NOT NULL DEFAULT '',
    "cover_url" VARCHAR(2048),
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "access" "ResourceAccess" NOT NULL DEFAULT 'PUBLIC',
    "price_minor" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GHS',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_content" (
    "resource_id" UUID NOT NULL,
    "body_markdown" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "resource_content_pkey" PRIMARY KEY ("resource_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_tags" (
    "resource_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "resource_tags_pkey" PRIMARY KEY ("resource_id","tag_id")
);

-- CreateTable
CREATE TABLE "resource_sections" (
    "id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "resource_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_items" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "section_id" UUID,
    "position" INTEGER NOT NULL,

    CONSTRAINT "resource_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");

-- CreateIndex
CREATE INDEX "resources_status_published_at_id_idx" ON "resources"("status", "published_at", "id");

-- CreateIndex
CREATE INDEX "resources_type_status_published_at_idx" ON "resources"("type", "status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "resource_tags_tag_id_resource_id_idx" ON "resource_tags"("tag_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_sections_id_resource_id_key" ON "resource_sections"("id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_sections_resource_id_position_key" ON "resource_sections"("resource_id", "position");

-- CreateIndex
CREATE INDEX "resource_items_resource_id_idx" ON "resource_items"("resource_id");

-- CreateIndex
CREATE INDEX "resource_items_section_id_collection_id_idx" ON "resource_items"("section_id", "collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_items_collection_id_resource_id_key" ON "resource_items"("collection_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_items_collection_id_position_key" ON "resource_items"("collection_id", "position");

-- AddForeignKey
ALTER TABLE "resource_content" ADD CONSTRAINT "resource_content_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_sections" ADD CONSTRAINT "resource_sections_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_items" ADD CONSTRAINT "resource_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_items" ADD CONSTRAINT "resource_items_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_items" ADD CONSTRAINT "resource_items_section_id_collection_id_fkey" FOREIGN KEY ("section_id", "collection_id") REFERENCES "resource_sections"("id", "resource_id") ON DELETE NO ACTION ON UPDATE CASCADE;
-- These invariants intentionally live in PostgreSQL as well as the service layer.
ALTER TABLE resources ADD CONSTRAINT resource_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE resources ADD CONSTRAINT resource_title_present CHECK (length(btrim(title)) > 0);
ALTER TABLE resources ADD CONSTRAINT resource_currency_format CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE resources ADD CONSTRAINT resource_price_matches_access CHECK (
  (access = 'PAID' AND price_minor > 0) OR (access <> 'PAID' AND price_minor = 0)
);
ALTER TABLE resources ADD CONSTRAINT resource_publication_date CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL);
ALTER TABLE resource_content ADD CONSTRAINT resource_body_size CHECK (length(body_markdown) <= 200000);
ALTER TABLE tags ADD CONSTRAINT tag_normalized CHECK (name = lower(btrim(name)) AND length(name) > 0);
ALTER TABLE resource_sections ADD CONSTRAINT section_position_nonnegative CHECK (position >= 0);
ALTER TABLE resource_sections ADD CONSTRAINT section_title_present CHECK (length(btrim(title)) > 0);
ALTER TABLE resource_items ADD CONSTRAINT item_position_nonnegative CHECK (position >= 0);
ALTER TABLE resource_items ADD CONSTRAINT resource_cannot_contain_itself CHECK (collection_id <> resource_id);

-- Serialize graph mutations, including direct SQL writes, to prevent concurrent
-- A -> B / B -> A edits from both passing a cycle check on stale graphs.
CREATE FUNCTION lock_resource_graph() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(18427651);
  RETURN NULL;
END $$;
CREATE TRIGGER resource_items_lock BEFORE INSERT OR UPDATE OR DELETE ON resource_items
  FOR EACH STATEMENT EXECUTE FUNCTION lock_resource_graph();
CREATE TRIGGER resource_sections_lock BEFORE INSERT OR UPDATE OR DELETE ON resource_sections
  FOR EACH STATEMENT EXECUTE FUNCTION lock_resource_graph();
CREATE TRIGGER resource_types_lock BEFORE UPDATE ON resources
  FOR EACH STATEMENT EXECUTE FUNCTION lock_resource_graph();

CREATE FUNCTION validate_resource_item() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_type "ResourceType"; child_type "ResourceType";
BEGIN
  SELECT type INTO parent_type FROM resources WHERE id = NEW.collection_id;
  SELECT type INTO child_type FROM resources WHERE id = NEW.resource_id;
  IF parent_type IS NULL OR child_type IS NULL THEN
    RAISE EXCEPTION 'Collection and child must exist' USING ERRCODE = '23503';
  END IF;
  IF parent_type NOT IN ('COURSE', 'PATH') THEN
    RAISE EXCEPTION 'Only courses and paths can contain resources' USING ERRCODE = '23514';
  END IF;
  IF parent_type = 'COURSE' AND child_type <> 'LESSON' THEN
    RAISE EXCEPTION 'Courses can contain only lessons' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    WITH RECURSIVE descendants(id) AS (
      SELECT NEW.resource_id
      UNION
      SELECT item.resource_id FROM resource_items item
      JOIN descendants d ON item.collection_id = d.id WHERE item.id <> NEW.id
    ) SELECT 1 FROM descendants WHERE id = NEW.collection_id
  ) THEN
    RAISE EXCEPTION 'Circular resource collection' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER resource_items_validate BEFORE INSERT OR UPDATE ON resource_items
  FOR EACH ROW EXECUTE FUNCTION validate_resource_item();

CREATE FUNCTION validate_resource_section() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM resources WHERE id = NEW.resource_id AND type IN ('COURSE', 'PATH')) THEN
    RAISE EXCEPTION 'Only courses and paths can have sections' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER resource_sections_validate BEFORE INSERT OR UPDATE ON resource_sections
  FOR EACH ROW EXECUTE FUNCTION validate_resource_section();

CREATE FUNCTION validate_resource_type_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = OLD.type THEN RETURN NEW; END IF;
  IF NEW.type NOT IN ('COURSE', 'PATH') AND (
    EXISTS (SELECT 1 FROM resource_items WHERE collection_id = OLD.id) OR
    EXISTS (SELECT 1 FROM resource_sections WHERE resource_id = OLD.id)
  ) THEN
    RAISE EXCEPTION 'Remove collection items and sections before changing its type' USING ERRCODE = '23514';
  END IF;
  IF NEW.type = 'COURSE' AND EXISTS (
    SELECT 1 FROM resource_items i JOIN resources child ON child.id = i.resource_id
    WHERE i.collection_id = OLD.id AND child.type <> 'LESSON'
  ) THEN
    RAISE EXCEPTION 'Courses can contain only lessons' USING ERRCODE = '23514';
  END IF;
  IF NEW.type <> 'LESSON' AND EXISTS (
    SELECT 1 FROM resource_items i JOIN resources parent ON parent.id = i.collection_id
    WHERE i.resource_id = OLD.id AND parent.type = 'COURSE'
  ) THEN
    RAISE EXCEPTION 'A course lesson cannot change to another type while included' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER resource_type_validate BEFORE UPDATE OF type ON resources
  FOR EACH ROW EXECUTE FUNCTION validate_resource_type_change();
