import { useState, useEffect, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import CheckoutDialog from "@/components/CheckoutDialog";
import CategorySlider from "@/components/CategorySlider";
import ProductImageGallery from "@/components/ProductImageGallery";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { products, isLoading } = useProducts();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
    null,
  );

  const product = products.find((p) => p.id === id);
  const variants = product?.variants ?? [];
  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants
    ? (variants.find((v) => (v.id ?? v.label) === selectedVariantKey) ??
      variants[0])
    : undefined;

  useEffect(() => {
    if (hasVariants && !selectedVariantKey) {
      setSelectedVariantKey(variants[0].id ?? variants[0].label);
    }
  }, [hasVariants, selectedVariantKey, variants]);

  const isUnavailable = product?.isAvailable === false;
  const stock = product?.stockCount;
  const isLowStock =
    !isUnavailable && typeof stock === "number" && stock > 0 && stock <= 5;
  const isOutBecauseStock =
    !isUnavailable && typeof stock === "number" && stock === 0;
  const blocked = isUnavailable || isOutBecauseStock;

  // Fetch product images
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!id) return;

      setImagesLoading(true);
      try {
        const { data, error } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", id)
          .order("display_order", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setProductImages(data.map((img) => img.image_url));
        } else if (product?.image) {
          // Fallback to legacy single image
          setProductImages([product.image]);
        } else {
          setProductImages([]);
        }
      } catch (error) {
        console.error("Error fetching product images:", error);
        if (product?.image) {
          setProductImages([product.image]);
        }
      } finally {
        setImagesLoading(false);
      }
    };

    fetchProductImages();
  }, [id, product?.image]);

  // Related products (same category)
  const relatedProducts = product
    ? products
        .filter(
          (p) => p.categoryId === product.categoryId && p.id !== product.id,
        )
        .slice(0, 8)
    : [];

  const productJsonLd = useMemo(
    () =>
      product
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description || product.name,
            image: product.image || "",
            offers: {
              "@type": "Offer",
              price: product.discount
                ? product.price - product.discount
                : product.price,
              priceCurrency: "EGP",
              availability:
                product.isAvailable === false || product.stockCount === 0
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
            },
          }
        : undefined,
    [product],
  );

  const handleAddToCart = () => {
    if (product && !blocked) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product, selectedVariant);
      }
      toast.success(`تمت إضافة ${quantity} إلى السلة`, {
        description: selectedVariant
          ? `${product.name} - ${selectedVariant.label}`
          : product.name,
      });
      setQuantity(1);
    }
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const basePrice = selectedVariant
    ? selectedVariant.price
    : product?.price || 0;
  const finalPrice = product?.discount
    ? basePrice - product.discount
    : basePrice;
  const hasDiscount = product?.discount && product.discount > 0;

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
            <p className="text-muted-foreground">
              عذراً، لم يتم العثور على هذا المنتج
            </p>
            <Link to="/products">
              <Button>العودة للمنتجات</Button>
            </Link>
          </div>
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
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onCartClick={() => setCartOpen(true)} />

      <SEOHead
        title={`${product.name} | حكاية ورقة`}
        description={
          product.description || `${product.name} - تسوق من حكاية ورقة`
        }
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
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Variants Selector */}
              {hasVariants && (
                <div className="space-y-2">
                  <span className="font-medium text-sm sm:text-base">
                    اختر الحجم:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const key = v.id ?? v.label;
                      const isSelected =
                        (selectedVariant?.id ?? selectedVariant?.label) === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedVariantKey(key)}
                          className={`flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all min-w-[72px] ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          <span className="text-sm sm:text-base font-bold">
                            {v.label}
                          </span>
                          <span
                            className={`text-[11px] sm:text-xs ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {v.price} ج.م
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                      {finalPrice} ج.م
                    </span>
                    <span className="text-lg sm:text-xl text-muted-foreground line-through">
                      {basePrice} ج.م
                    </span>
                    <span className="bg-destructive/10 text-destructive px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      وفر {product.discount} ج.م
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                    {basePrice} ج.م
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="font-medium text-sm sm:text-base">
                  الكمية:
                </span>
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
                  <span className="w-10 sm:w-12 text-center text-base sm:text-lg font-semibold">
                    {quantity}
                  </span>
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

              {/* Add to Cart Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="flex-1 gap-2 h-12 sm:h-14 text-base sm:text-lg"
                  onClick={handleAddToCart}
                  disabled={blocked}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {blocked ? "غير متوفر" : "أضف للسلة"}
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
              <CategorySlider
                title="منتجات مشابهة"
                products={relatedProducts}
              />
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
