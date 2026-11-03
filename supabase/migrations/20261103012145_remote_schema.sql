SET local check_function_bodies = off;

CREATE TABLE "public"."categories" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "categories_name_key" UNIQUE (name),
  CONSTRAINT "categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inventory_logs" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "item_id"     uuid                     NOT NULL,
  "worker_id"   uuid                     NOT NULL,
  "change_type" text                     NOT NULL,
  "quantity"    numeric(10,2)            NOT NULL,
  "notes"       text,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "inventory_logs_change_type_check" CHECK ((change_type = ANY (ARRAY['IN'::text, 'OUT'::text, 'ADJUSTMENT'::text]))),
  CONSTRAINT "inventory_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "inventory_logs_quantity_check" CHECK ((quantity > (0)::numeric))
);

ALTER TABLE "public"."inventory_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."items" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "sku"             text,
  "name"            text                     NOT NULL,
  "category_id"     uuid,
  "unit"            text                     NOT NULL,
  "current_stock"   numeric(10,2)            DEFAULT 0,
  "min_stock_level" numeric(10,2)            DEFAULT 0,
  "location_bin"    text,
  "updated_at"      timestamp with time zone DEFAULT now(),
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "items_current_stock_check" CHECK ((current_stock >= (0)::numeric)),
  CONSTRAINT "items_pkey" PRIMARY KEY (id),
  CONSTRAINT "items_sku_key" UNIQUE (sku)
);

ALTER TABLE "public"."items"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_item_stock()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.change_type = 'IN' THEN
    UPDATE items 
    SET current_stock = current_stock + NEW.quantity, updated_at = NOW() 
    WHERE id = NEW.item_id;
  ELSIF NEW.change_type = 'OUT' THEN
    UPDATE items 
    SET current_stock = current_stock - NEW.quantity, updated_at = NOW() 
    WHERE id = NEW.item_id;
  ELSIF NEW.change_type = 'ADJUSTMENT' THEN
    -- For manual cycle counts (overriding the stock directly)
    UPDATE items 
    SET current_stock = NEW.quantity, updated_at = NOW() 
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$function$;

ALTER TABLE "public"."inventory_logs"
  ADD CONSTRAINT "inventory_logs_worker_id_fkey" FOREIGN KEY (worker_id) REFERENCES auth.users(id);

ALTER TABLE "public"."items"
  ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE "public"."inventory_logs"
  ADD CONSTRAINT "inventory_logs_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;

CREATE TRIGGER trigger_update_stock
  AFTER INSERT ON public.inventory_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_item_stock();

CREATE POLICY "Allow workers to modify categories" ON "public"."categories"
  FOR ALL
  TO "authenticated"
  USING (true);

CREATE POLICY "Allow workers to read categories" ON "public"."categories"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Allow workers to insert logs" ON "public"."inventory_logs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (true);

CREATE POLICY "Allow workers to read logs" ON "public"."inventory_logs"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Allow workers to modify items" ON "public"."items"
  FOR ALL
  TO "authenticated"
  USING (true);

CREATE POLICY "Allow workers to read items" ON "public"."items"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT EXECUTE ON FUNCTION "public"."update_item_stock"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."update_item_stock"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_item_stock"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_item_stock"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_logs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."inventory_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_logs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_logs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."items" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."items" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."items" TO "service_role";

