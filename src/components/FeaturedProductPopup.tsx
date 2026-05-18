import { useEffect, useState } from 'react';
import { X, ShoppingCart, Sparkles, Tag } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useCart } from '@/context/CartContext';
import { ProductVariant } from '@/types/product';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SESSION_FLAG = 'featured_popup_shown';

const FeaturedProductPopup = () => {
  const { products } = useProducts();
  const { getCategoryById } = useCategories();
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    const init = async () => {
      if (sessionStorage.getItem(SESSION_FLAG) === '1') return;

      const { data } = await supabase
        .from('store_settings')
        .select('key, value')
        .in('key', ['featured_product_enabled', 'featured_product_id']);

      if (!data) return;

      let enabled = false;
      let pid = '';
      data.forEach((row) => {
        if (row.key === 'featured_product_enabled') enabled = row.value === 'true';
        if (row.key === 'featured_product_id') pid = row.value || '';
      });

      if (!enabled || !pid) return;
      setProductId(pid);
      setTimeout(() => setOpen(true), 600);
      sessionStorage.setItem(SESSION_FLAG, '1');
    };
    init();
  }, []);

  const product = products.find((p) => p.id === productId);
  const hasVariants = !!(product?.variants && product.variants.length > 0);

  // Auto-select first variant when product loads
  useEffect(() => {
    if (hasVariants && product && !selectedVariant) {
      setSelectedVariant(product.variants![0]);
    }
  }, [hasVariants, product, selectedVariant]);

  if (!product) return null;

  const category = product.categoryId ? getCategoryById(product.categoryId) : null;
  const basePrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
  const finalPrice = product.discount ? basePrice - product.discount : basePrice;

  const blocked =
    product.isAvailable === false ||
    (typeof product.stockCount === 'number' && product.stockCount === 0);

  const handleBuy = () => {
    if (blocked) {
      toast.error('هذا المنتج غير متوفر حالياً');
      return;
    }
    if (hasVariants && !selectedVariant) {
      toast.error('برجاء اختيار الحجم');
      return;
    }
    addToCart(product, selectedVariant || undefined);
    toast.success('تمت الإضافة للسلة', {
      description: selectedVariant ? `${product.name} — ${selectedVariant.label}` : product.name,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20 max-h-[90vh] overflow-y-auto" dir="rtl">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 left-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-square w-full bg-gradient-to-br from-secondary/40 to-muted/20">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            منتج مميز
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-bold text-foreground">{product.name}</h3>
            {category && (
              <div className="inline-flex items-center gap-1.5 bg-secondary/60 text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3" />
                {category.name}
              </div>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.shortDescription}
            </p>
          )}
          {!product.shortDescription && product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Variant Selector */}
          {hasVariants && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-foreground">اختر الحجم:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants!.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "flex flex-col items-center justify-center px-3 py-2 rounded-lg border-2 transition-all min-w-[78px]",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <span className="font-bold text-sm leading-tight">{v.label}</span>
                      {v.pageCount ? (
                        <span className={cn("text-[11px] leading-tight", isSelected ? "opacity-90" : "text-muted-foreground")}>
                          {v.pageCount} ورقة
                        </span>
                      ) : null}
                      <span className={cn("text-[11px] font-semibold leading-tight mt-0.5", isSelected ? "opacity-90" : "text-muted-foreground")}>
                        {v.price} ج.م
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {product.discount && product.discount > 0 ? (
              <>
                <span className="text-2xl font-bold text-primary">{finalPrice} ج.م</span>
                <span className="text-sm text-muted-foreground line-through">{basePrice} ج.م</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary">{basePrice} ج.م</span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleBuy} className="flex-1 gap-2" disabled={blocked}>
              <ShoppingCart className="h-4 w-4" />
              {blocked ? 'غير متوفر' : 'اشتر الآن'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeaturedProductPopup;
