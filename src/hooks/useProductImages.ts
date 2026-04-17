import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

export const useProductImages = (productId?: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!productId) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data?.map(img => img.image_url) || []);
    } catch (error) {
      console.error('Error fetching product images:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const saveImages = async (productId: string, imageUrls: string[]) => {
    try {
      // Delete existing images for this product
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      // Insert new images if any
      if (imageUrls.length > 0) {
        const imagesToInsert = imageUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index
        }));

        const { error } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving product images:', error);
      throw error;
    }
  };

  return {
    images,
    isLoading,
    fetchImages,
    saveImages
  };
};

// Fetch images for multiple products at once
export const useMultipleProductImages = (productIds: string[]) => {
  const [imagesMap, setImagesMap] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllImages = async () => {
      if (productIds.length === 0) {
        setImagesMap({});
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_images')
          .select('product_id, image_url, display_order')
          .in('product_id', productIds)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const map: Record<string, string[]> = {};
        data?.forEach(img => {
          if (!map[img.product_id]) {
            map[img.product_id] = [];
          }
          map[img.product_id].push(img.image_url);
        });

        setImagesMap(map);
      } catch (error) {
        console.error('Error fetching product images:', error);
        setImagesMap({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllImages();
  }, [productIds.join(',')]);

  return { imagesMap, isLoading };
};