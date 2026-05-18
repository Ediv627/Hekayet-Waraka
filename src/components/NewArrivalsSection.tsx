import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/context/ProductContext';
import ProductCard from '@/components/ProductCard';
import { cn } from '@/lib/utils';

const NewArrivalsSection = () => {
  const { products, isLoading } = useProducts();
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'new_arrivals_count')
        .maybeSingle();
      if (data?.value) {
        const n = parseInt(data.value, 10);
        if (!isNaN(n) && n > 0) setCount(n);
      }
    };
    fetchSetting();
  }, []);

  const newArrivals = products
    .filter((p) => p.isNewArrival)
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, count);

  const hasMultiple = newArrivals.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: hasMultiple, align: 'center', slidesToScroll: 1 },
    hasMultiple ? [Autoplay({ delay: 4000, stopOnInteraction: true })] : []
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect, newArrivals.length]);

  if (isLoading || newArrivals.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-secondary/10 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
            وصل حديثاً ✨
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            أحدث ما أضفناه إلى المتجر
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {hasMultiple && (
            <>
              <button
                onClick={() => emblaApi?.scrollNext()}
                aria-label="السابق"
                className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                aria-label="التالي"
                className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Embla Viewport */}
          <div className="overflow-hidden mx-8 md:mx-12" ref={emblaRef}>
            <div className="flex">
              {newArrivals.map((product) => (
                <div
                  key={product.id}
                  className="relative flex-[0_0_100%] min-w-0 px-3"
                >
                  <div className="mx-auto w-full max-w-sm">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dot Indicators */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`الانتقال إلى ${index + 1}`}
                className={cn(
                  'rounded-full transition-all duration-300',
                  index === selectedIndex
                    ? 'w-8 h-2.5 bg-primary'
                    : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrivalsSection;
