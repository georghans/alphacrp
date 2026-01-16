ALTER TABLE offer_images
  ALTER COLUMN image_data TYPE TEXT
  USING encode(image_data, 'base64');
