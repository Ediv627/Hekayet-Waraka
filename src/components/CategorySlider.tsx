import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';

interface CategorySliderProps {
  title: string;
  products: Product[];
}

const CategorySlider = ({ title, products }: CategorySliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group/slider">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full flex-shrink-0" />
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground truncate">
            {title}
          </h2>
          <span className="text-xs md:text-sm text-muted-foreground bg-secondary/50 px-2 md:px-3 py-0.5 md:py-1 rounded-full flex-shrink-0">
            {products.length} منتج
          </span>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex gap-1 md:gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-8 w-8 md:h-10 md:w-10 rounded-full border-border/50 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-8 w-8 md:h-10 md:w-10 rounded-full border-border/50 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {/* Products Slider */}
      <div className="relative -mx-4 px-4">
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] animate-fade-in"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        
        {/* Gradient Edges */}
        <div className="absolute left-0 top-0 bottom-4 w-4 md:w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-4 md:w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default CategorySlider;
