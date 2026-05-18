import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCategories } from '@/context/CategoryContext';
import { cn } from '@/lib/utils';

const CategoryCarousel = () => {
  const { categories, isLoading } = useCategories();
  const visibleCategories = categories.filter(c => c.image_url);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
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
  }, [emblaApi, onSelect]);

  if (isLoading || visibleCategories.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
            اكتشف مجموعاتنا
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Prev Arrow (RTL) */}
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="السابق"
            className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Next Arrow (RTL) */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="التالي"
            className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Embla Viewport */}
          <div className="overflow-hidden mx-8 md:mx-12" ref={emblaRef}>
            <div className="flex">
              {visibleCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative flex-[0_0_100%] min-w-0 px-3"
                >
                  <Link to={`/category/${category.id}`} className="block group">
                    <div className="relative overflow-hidden rounded-[20px] shadow-xl aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/7]">
                      {/* Background Image */}
                      <img
                        src={category.image_url!}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/50" />

                      {/* Offer Badge */}
                      {category.has_offer && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          عروض حصرية
                        </div>
                      )}

                      {/* Centered Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                          {category.name}
                        </h3>
                        <span className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm md:text-base font-bold uppercase tracking-wider shadow-md transition-all duration-300 group-hover:bg-primary/90 group-hover:scale-105">
                          SHOP NOW
                        </span>
                      </div>
                    </div>
                  </Link>
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

export default CategoryCarousel;

