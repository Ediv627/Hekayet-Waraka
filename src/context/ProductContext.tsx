import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductVariant } from '@/types/product';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });
    
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (!error) {
      const variantsByProduct: Record<string, ProductVariant[]> = {};
      (variantsData || []).forEach((v: any) => {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push({
          id: v.id,
          label: v.label,
          pageCount: v.page_count,
          price: Number(v.price),
          displayOrder: v.display_order,
        });
      });

      setProducts((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.image || '',
        categoryId: p.category_id || undefined,
        description: p.description || undefined,
        shortDescription: p.short_description || undefined,
        discount: p.discount ? Number(p.discount) : undefined,
        isAvailable: p.is_available !== false,
        stockCount: p.stock_count === null || p.stock_count === undefined ? null : Number(p.stock_count),
        createdAt: p.created_at,
        isNewArrival: p.is_new_arrival === true,
        variants: variantsByProduct[p.id] || [],
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, fetchProducts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('products').insert({
      name: product.name,
      price: product.price,
      image: product.image,
      category_id: product.categoryId || null,
      description: product.description || null,
      short_description: product.shortDescription || null,
      discount: product.discount || 0,
      is_available: product.isAvailable !== false,
      stock_count: product.stockCount ?? null,
      is_new_arrival: product.isNewArrival === true,
    });
    if (error) throw error;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.shortDescription !== undefined) dbUpdates.short_description = updates.shortDescription || null;
    if (updates.discount !== undefined) dbUpdates.discount = updates.discount || 0;
    if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
    if (updates.stockCount !== undefined) dbUpdates.stock_count = updates.stockCount;
    if (updates.isNewArrival !== undefined) dbUpdates.is_new_arrival = updates.isNewArrival;
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) throw error;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  };

  return (
    <ProductContext.Provider value={{ products, isLoading, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};
