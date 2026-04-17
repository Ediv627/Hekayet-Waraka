import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import CategorySlider from '@/components/CategorySlider';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import CheckoutDialog from '@/components/CheckoutDialog';
import { Input } from '@/components/ui/input';

const Products = () => {
  const { products, isLoading: productsLoading } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isLoading = productsLoading || categoriesLoading;

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by category
  const productsByCategory = categories
    .map((category) => ({
      category,
      products: filteredProducts.filter((p) => p.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);

  // Products without category
  const uncategorizedProducts = filteredProducts.filter((p) => !p.categoryId);

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onCartClick={() => setCartOpen(true)} />

      <SEOHead
        title="جميع المنتجات | حكاية ورقة - Hekayet Waraka"
        description="تصفح جميع منتجات حكاية ورقة من أدوات كتابة، دفاتر، أقلام وقرطاسية فاخرة."
        canonical="https://storypapper.lovable.app/products"
      />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/30 to-accent/5 py-8 md:py-12 lg:py-16">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 h-48 md:h-64 w-48 md:w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 md:h-64 w-48 md:w-64 rounded-full bg-accent/10 blur-3xl" />
          </div>
          
          <div className="container relative mx-auto px-4">
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
              <Link 
                to="/" 
                className="group flex items-center gap-1.5 md:gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:-translate-x-1" />
                <span>العودة للرئيسية</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm font-medium">اكتشف منتجاتنا</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground">
                  جميع المنتجات
                </h1>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-1.5 md:gap-2 bg-primary/10 text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-full">
                    <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="font-semibold text-sm md:text-base">{filteredProducts.length}</span>
                    <span className="text-xs md:text-sm">منتج متاح</span>
                  </div>
                  <div className="h-1 w-12 md:w-16 bg-gradient-to-r from-primary to-primary/30 rounded-full" />
                </div>
              </div>
              
              {/* Search */}
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl md:rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-background/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-0.5 md:p-1 border border-border/50 shadow-lg">
                  <div className="relative">
                    <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن منتج..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 md:pr-12 h-11 md:h-14 text-sm md:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-8 md:py-12 lg:py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
              </div>
            ) : (
              <div className="space-y-16">
                {/* Products grouped by category as sliders */}
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <CategorySlider
                    key={category.id}
                    title={category.name}
                    products={categoryProducts}
                  />
                ))}

                {/* Uncategorized products */}
                {uncategorizedProducts.length > 0 && (
                  <CategorySlider
                    title="منتجات أخرى"
                    products={uncategorizedProducts}
                  />
                )}

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                  <div className="py-24 text-center">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/50 mb-6">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                    {searchQuery ? (
                      <>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          لم نجد نتائج لـ "{searchQuery}"
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          جرب البحث بكلمات مختلفة
                        </p>
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          مسح البحث
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          لا توجد منتجات
                        </h3>
                        <p className="text-muted-foreground">
                          لا توجد منتجات متاحة حالياً. تحقق لاحقاً!
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
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

export default Products;
