DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'offer_images'
      AND column_name = 'image_data'
      AND data_type = 'bytea'
  ) THEN
    ALTER TABLE offer_images
      ALTER COLUMN image_data TYPE TEXT
      USING encode(image_data, 'base64');
  END IF;
END $$;
