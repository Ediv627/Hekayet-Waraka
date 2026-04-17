import { Plus, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success('تمت الإضافة للسلة', {
      description: product.name,
    });
  };

  const finalPrice = product.discount ? product.price - product.discount : product.price;
  const hasDiscount = product.discount && product.discount > 0;

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className="group relative h-full bg-card rounded-xl md:rounded-2xl overflow-hidden border border-border/30 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2">
        {/* Image Container */}
        <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-gradient-to-br from-secondary/50 to-muted/30">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg animate-pulse">
              خصم {product.discount} ج.م
            </div>
          )}

          {/* Add to Cart Button - Appears on Hover (Desktop) */}
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 hidden sm:block">
            <Button
              onClick={handleAddToCart}
              className="w-full gap-2 bg-background/95 text-foreground hover:bg-primary hover:text-primary-foreground backdrop-blur-sm border border-border/50 rounded-xl h-10 md:h-12 text-sm md:text-base font-medium transition-all duration-300"
            >
              <ShoppingCart className="h-4 w-4" />
              أضف للسلة
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          <div className="space-y-0.5 md:space-y-1">
            <h3 className="font-serif text-sm md:text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block">
                {product.description}
              </p>
            )}
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-1 md:gap-2 pt-1 md:pt-2 border-t border-border/30">
            {hasDiscount ? (
              <>
                <span className="text-base md:text-xl font-bold text-primary">{finalPrice} ج.م</span>
                <span className="text-[10px] md:text-sm text-muted-foreground line-through">{product.price} ج.م</span>
              </>
            ) : (
              <span className="text-base md:text-xl font-bold text-primary">{product.price} ج.م</span>
            )}
          </div>

          {/* Mobile Add to Cart */}
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="w-full gap-1.5 sm:hidden h-9 text-xs rounded-lg"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            أضف للسلة
          </Button>
        </div>

        {/* Quick Add Button - Shows on both mobile and desktop hover */}
        <button
          onClick={handleAddToCart}
          className="absolute top-2 left-2 md:top-3 md:left-3 h-8 w-8 md:h-10 md:w-10 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-lg sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
