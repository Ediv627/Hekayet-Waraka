import { useState, useEffect, useMemo } from 'react';
import SEOHead from '@/components/SEOHead';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Minus, Plus, Loader2, Package, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import CheckoutDialog from '@/components/CheckoutDialog';
import CategorySlider from '@/components/CategorySlider';
import ProductImageGallery from '@/components/ProductImageGallery';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { products, isLoading } = useProducts();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${id}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('تم نسخ رابط المنتج');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('تعذّر النسخ، انسخ الرابط يدويًا');
    }
  };

  const product = products.find((p) => p.id === id);
  const hasVariants = !!(product?.variants && product.variants.length > 0);
  const selectedVariant = hasVariants
    ? product!.variants!.find((v) => v.id === selectedVariantId) || null
    : null;

  useEffect(() => {
    if (hasVariants && !selectedVariantId && product) {
      setSelectedVariantId(product.variants![0].id);
    }
  }, [hasVariants, product, selectedVariantId]);

  const isUnavailable = product?.isAvailable === false;
  const stock = product?.stockCount;
  const isLowStock = !isUnavailable && typeof stock === 'number' && stock > 0 && stock <= 5;
  const isOutBecauseStock = !isUnavailable && typeof stock === 'number' && stock === 0;
  const blocked = isUnavailable || isOutBecauseStock;
  
  // Fetch product images
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!id) return;
      
      setImagesLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', id)
          .order('display_order', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setProductImages(data.map(img => img.image_url));
        } else if (product?.image) {
          setProductImages([product.image]);
        } else {
          setProductImages([]);
        }
      } catch (error) {
        console.error('Error fetching product images:', error);
        if (product?.image) {
          setProductImages([product.image]);
        }
      } finally {
        setImagesLoading(false);
      }
    };

    fetchProductImages();
  }, [id, product?.image]);
  
  const relatedProducts = product
    ? products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 8)
    : [];

  const productJsonLd = useMemo(() => product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || product.name,
    "image": product.image || '',
    "offers": {
      "@type": "Offer",
      "price": product.discount ? product.price - product.discount : product.price,
      "priceCurrency": "EGP",
      "availability": product.isAvailable === false || product.stockCount === 0
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  } : undefined, [product]);

  const handleAddToCart = () => {
    if (!product || blocked) return;
    if (hasVariants && !selectedVariant) {
      toast.error('من فضلك اختر مقاسًا أولاً');
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedVariant || undefined);
    }
    toast.success(`تمت إضافة ${quantity} إلى السلة`, {
      description: selectedVariant ? `${product.name} — ${selectedVariant.label || (selectedVariant.pageCount ? `${selectedVariant.pageCount} ورقة` : '')}` : product.name,
    });
    setQuantity(1);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const basePrice = hasVariants && selectedVariant ? selectedVariant.price : (product?.price || 0);
  const effectiveDiscount = hasVariants && selectedVariant && selectedVariant.discount && selectedVariant.discount > 0
    ? selectedVariant.discount
    : (product?.discount || 0);
  const finalPrice = effectiveDiscount ? basePrice - effectiveDiscount : basePrice;
  const hasDiscount = effectiveDiscount > 0;
  const promoText = selectedVariant?.promoText || null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header onCartClick={() => setCartOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header onCartClick={() => setCartOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
            <p className="text-muted-foreground">عذراً، لم يتم العثور على هذا المنتج</p>
            <Link to="/products">
              <Button>العودة للمنتجات</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />
        <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onCartClick={() => setCartOpen(true)} />

      <SEOHead
        title={`${product.name} | حكاية ورقة`}
        description={product.description || `${product.name} - تسوق من حكاية ورقة`}
        canonical={`https://storypapper.lovable.app/product/${product.id}`}
        ogImage={product.image || undefined}
        jsonLd={productJsonLd}
      />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للمنتجات
          </Link>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-4 pb-12">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            {/* Product Images Gallery */}
            <div className="relative">
              {imagesLoading ? (
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-secondary/50 to-muted/30 border border-border/30 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductImageGallery
                  images={productImages}
                  productName={product.name}
                  hasDiscount={hasDiscount}
                  discountAmount={product.discount}
                />
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
              <div>
                <h1 dir="rtl" className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3 bidi-plaintext">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p dir="rtl" className="text-sm sm:text-base text-muted-foreground/90 mb-2 bidi-plaintext">
                    {product.shortDescription}
                  </p>
                )}
                {product.description && (
                  <p dir="rtl" className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap bidi-plaintext">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div>
                {blocked ? (
                  <span className="inline-block bg-destructive text-destructive-foreground text-sm font-bold px-4 py-2 rounded-full">
                    غير متوفر الآن
                  </span>
                ) : isLowStock ? (
                  <span className="inline-block bg-stock-urgent text-stock-urgent-foreground text-sm font-bold px-4 py-2 rounded-full">
                    تبقى {stock} قطع فقط! 🔥 اشتر الان
                  </span>
                ) : (
                  <span className="inline-block bg-stock-available text-stock-available-foreground text-sm font-medium px-4 py-2 rounded-full">
                    متوفر ✓
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{finalPrice} ج.م</span>
                    <span className="text-lg sm:text-xl text-muted-foreground line-through">{basePrice} ج.م</span>
                    <span className="bg-destructive/10 text-destructive px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      وفر {effectiveDiscount} ج.م
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{basePrice} ج.م</span>
                )}
              </div>

              {promoText && (
                <div className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 text-primary font-semibold text-sm sm:text-base">
                  🎁 {promoText}
                </div>
              )}

              {/* Variant Selector */}
              {hasVariants && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">المقاس:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map((v) => {
                      const isSelected = selectedVariantId === v.id;
                      const vHasDiscount = !!(v.discount && v.discount > 0);
                      const vFinal = vHasDiscount ? v.price - (v.discount || 0) : v.price;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`relative flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all min-w-[90px] ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground shadow-md'
                              : 'border-border bg-background hover:border-primary/50'
                          }`}
                        >
                          {vHasDiscount && (
                            <span className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                              -{v.discount} ج.م
                            </span>
                          )}
                          {v.label ? (
                            <span className="font-bold text-base">{v.label}</span>
                          ) : null}
                          {v.pageCount ? (
                            <span className={`${v.label ? 'text-xs' : 'font-bold text-base'} ${v.label ? (isSelected ? 'opacity-90' : 'text-muted-foreground') : ''}`}>
                              {v.pageCount} ورقة
                            </span>
                          ) : null}
                          <span className={`text-xs font-semibold ${isSelected ? 'opacity-95' : 'text-primary'}`}>
                            {vHasDiscount ? (
                              <>{vFinal} <span className="line-through opacity-70">{v.price}</span> ج.م</>
                            ) : (
                              <>{v.price} ج.م</>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="font-medium text-sm sm:text-base">الكمية:</span>
                <div className="flex items-center gap-1 sm:gap-2 border border-border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="w-10 sm:w-12 text-center text-base sm:text-lg font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              {/* Short Product Link */}
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  رابط المنتج — شاركه مع أصدقائك
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-background border border-border rounded-md px-3 py-2 text-xs sm:text-sm text-foreground/80 truncate"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={copied ? 'default' : 'outline'}
                    onClick={handleCopyLink}
                    className="gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    {copied ? 'تم النسخ' : 'نسخ'}
                  </Button>
                </div>
              </div>


              {/* Add to Cart Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="flex-1 gap-2 h-12 sm:h-14 text-base sm:text-lg"
                  onClick={handleAddToCart}
                  disabled={blocked}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {blocked ? 'غير متوفر' : 'أضف للسلة'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg"
                  disabled={blocked}
                  onClick={() => {
                    handleAddToCart();
                    setCartOpen(true);
                  }}
                >
                  اشترِ الآن
                </Button>
              </div>


              {/* Total Price */}
              {quantity > 1 && (
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">
                      {(finalPrice * quantity).toFixed(2)} ج.م
                    </span>
                    <span className="text-muted-foreground">
                      الإجمالي ({quantity} قطعة)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-secondary/20">
            <div className="container mx-auto px-4">
              <CategorySlider title="منتجات مشابهة" products={relatedProducts} />
            </div>
          </section>
        )}
      </main>

      <Footer />

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
};

export default ProductDetails;
