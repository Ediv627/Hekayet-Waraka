import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/product';

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  addCategory: (name: string, extra?: { image_url?: string; display_order?: number; has_offer?: boolean }) => Promise<void>;
  updateCategory: (id: string, updates: Partial<{ name: string; image_url: string; display_order: number; has_offer: boolean }>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (!error) setCategories(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addCategory = async (name: string, extra?: { image_url?: string; display_order?: number; has_offer?: boolean }) => {
    const { error } = await supabase.from('categories').insert({ name, ...extra });
    if (error) throw error;
  };

  const updateCategory = async (id: string, updates: Partial<{ name: string; image_url: string; display_order: number; has_offer: boolean }>) => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (error) throw error;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  };

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  return (
    <CategoryContext.Provider value={{ categories, isLoading, addCategory, updateCategory, deleteCategory, getCategoryById }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within a CategoryProvider');
  return context;
};
