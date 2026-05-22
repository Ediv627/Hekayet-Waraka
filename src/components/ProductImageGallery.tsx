import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  hasDiscount?: boolean;
  discountAmount?: number;
}

const ProductImageGallery = ({ images, productName, hasDiscount, discountAmount }: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // If no images, use placeholder
  const displayImages = images.length > 0 ? images : ['/placeholder.svg'];
  const currentImage = displayImages[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Image */}
      <div className="relative group">
        <div className="aspect-square overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary/50 to-muted/30 border border-border/30">
          <img
            src={currentImage}
            alt={`${productName} - صورة ${selectedIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
          />
          
          {/* Discount Badge */}
          {hasDiscount && discountAmount && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-destructive text-destructive-foreground text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
              خصم {discountAmount} ج.م
            </div>
          )}

          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/30 scale-105"
                  : "border-border/30 hover:border-primary/50 opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={image}
                alt={`${productName} - صورة مصغرة ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl md:max-w-5xl p-0 overflow-hidden bg-background/95 backdrop-blur-md">
          <div className="relative">
            <img
              src={currentImage}
              alt={productName}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            
            {/* Navigation in zoom mode */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}

            {/* Thumbnails in zoom mode */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-xl">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all duration-300",
                      selectedIndex === index
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/30 hover:border-primary/50 opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={image}
                      alt={`صورة ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;