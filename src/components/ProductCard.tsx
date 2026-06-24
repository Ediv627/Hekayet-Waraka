import { useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const hasVariants = !!(product.variants && product.variants.length > 0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? product.variants![0] : null
  );

  const isUnavailable = product.isAvailable === false;
  const stock = product.stockCount;
  const isLowStock = !isUnavailable && typeof stock === 'number' && stock > 0 && stock <= 5;
  const isOutBecauseStock = !isUnavailable && typeof stock === 'number' && stock === 0;
  const blocked = isUnavailable || isOutBecauseStock;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (blocked) return;
    if (hasVariants && !selectedVariant) {
      toast.error('من فضلك اختر مقاسًا أولاً');
      return;
    }
    addToCart(product, selectedVariant || undefined);
    toast.success('تمت الإضافة للسلة', {
      description: selectedVariant ? `${product.name} — ${selectedVariant.label}` : product.name,
    });
  };

  const basePrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
  const effectiveDiscount = hasVariants && selectedVariant && selectedVariant.discount && selectedVariant.discount > 0
    ? selectedVariant.discount
    : (product.discount || 0);
  const finalPrice = effectiveDiscount ? basePrice - effectiveDiscount : basePrice;
  const hasDiscount = effectiveDiscount > 0;
  const promoText = selectedVariant?.promoText || null;

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className="group relative h-full bg-card rounded-xl md:rounded-2xl overflow-hidden border border-border/30 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2">
        {/* Image Container */}
        <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-gradient-to-br from-secondary/50 to-muted/30">
          <img
            src={product.image}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700 group-hover:scale-110",
              blocked && "opacity-60 grayscale"
            )}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {hasDiscount && !blocked && (
            <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg animate-pulse">
              خصم {effectiveDiscount} ج.م
            </div>
          )}

          <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3">
            {blocked ? (
              <span className="bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg">
                غير متوفر الآن
              </span>
            ) : isLowStock ? (
              <span className="bg-stock-urgent text-stock-urgent-foreground text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg">
                تبقى {stock} قطع فقط! 🔥 اشتر الان
              </span>
            ) : (
              <span className="bg-stock-available text-stock-available-foreground text-[10px] md:text-xs font-medium px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg">
                متوفر ✓
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          <div className="space-y-0.5 md:space-y-1">
            <h3 dir="rtl" className="font-serif text-sm md:text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300 bidi-plaintext">
              {product.name}
            </h3>
            {product.shortDescription && (
              <p dir="rtl" className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 leading-relaxed bidi-plaintext">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Variant Selector */}
          {hasVariants && (
            <div className="flex flex-wrap gap-2" onClick={(e) => e.preventDefault()}>
              {product.variants!.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const vHasDiscount = !!(v.discount && v.discount > 0);
                const vFinal = vHasDiscount ? v.price - (v.discount || 0) : v.price;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariant(v);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center px-3 md:px-4 py-2 md:py-2.5 rounded-lg border-2 transition-all min-w-[72px] md:min-w-[88px]",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    {vHasDiscount && (
                      <span className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                        -{v.discount} ج.م
                      </span>
                    )}
                    <span className="font-bold text-sm md:text-base leading-tight">{v.label}</span>
                    {v.pageCount ? (
                      <span className={cn("text-[11px] md:text-xs leading-tight", isSelected ? "opacity-90" : "text-muted-foreground")}>
                        {v.pageCount} ورقة
                      </span>
                    ) : null}
                    <span className={cn("text-[11px] md:text-xs font-semibold leading-tight mt-0.5", isSelected ? "opacity-90" : "text-muted-foreground")}>
                      {vHasDiscount ? (
                        <>
                          {vFinal} <span className={cn("line-through opacity-70", isSelected ? "" : "text-muted-foreground/70")}>{v.price}</span> ج.م
                        </>
                      ) : (
                        <>{v.price} ج.م</>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {promoText && (
            <div className="text-[11px] md:text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-md text-center">
              🎁 {promoText}
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-1 md:gap-2 pt-1 md:pt-2 border-t border-border/30">
            {hasDiscount ? (
              <>
                <span className="text-base md:text-xl font-bold text-primary">{finalPrice} ج.م</span>
                <span className="text-[10px] md:text-sm text-muted-foreground line-through">{basePrice} ج.م</span>
              </>
            ) : (
              <span className="text-base md:text-xl font-bold text-primary">{basePrice} ج.م</span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            size="sm"
            disabled={blocked}
            className="w-full gap-1.5 h-9 text-xs rounded-lg"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {blocked ? 'غير متوفر' : 'أضف للسلة'}
          </Button>
        </div>

        {!blocked && !hasVariants && (
          <button
            onClick={handleAddToCart}
            className="absolute top-2 left-2 md:top-3 md:left-3 h-8 w-8 md:h-10 md:w-10 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-lg sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
