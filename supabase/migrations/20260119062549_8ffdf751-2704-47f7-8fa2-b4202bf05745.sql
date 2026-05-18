-- Allow anyone to upload transfer images to the transfers folder
CREATE POLICY "Anyone can upload transfer images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'transfers'
);