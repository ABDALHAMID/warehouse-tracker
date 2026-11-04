-- Allow anon to read categories and items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Allow anon to read categories'
  ) THEN
    CREATE POLICY "Allow anon to read categories" ON public.categories
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'items' AND policyname = 'Allow anon to read items'
  ) THEN
    CREATE POLICY "Allow anon to read items" ON public.items
      FOR SELECT TO anon USING (true);
  END IF;
END $$;
