import { useState, useMemo } from 'react';
import SEOHead from '@/components/SEOHead';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import CheckoutDialog from '@/components/CheckoutDialog';

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { products, isLoading: productsLoading } = useProducts();
  const { getCategoryById, isLoading: categoriesLoading } = useCategories();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const category = id ? getCategoryById(id) : undefined;
  const isLoading = productsLoading || categoriesLoading;

  // Filter products by category, discounted first
  const categoryProducts = useMemo(() => {
    const filtered = products.filter(p => p.categoryId === id);
    return filtered.sort((a, b) => {
      const aDiscount = a.discount || 0;
      const bDiscount = b.discount || 0;
      if (bDiscount > 0 && aDiscount === 0) return 1;
      if (aDiscount > 0 && bDiscount === 0) return -1;
      return bDiscount - aDiscount;
    });
  }, [products, id]);

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onCartClick={() => setCartOpen(true)} />

      <SEOHead
        title={`${category?.name || 'القسم'} | حكاية ورقة`}
        description={`تصفح منتجات ${category?.name || ''} من حكاية ورقة - أدوات كتابة وقرطاسية فاخرة`}
        canonical={`https://storypapper.lovable.app/category/${id}`}
      />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/30 to-accent/5 py-8 md:py-12">
          {category?.image_url && (
            <div className="absolute inset-0">
              <img src={category.image_url} alt="" className="w-full h-full object-cover opacity-15" />
            </div>
          )}
          <div className="container relative mx-auto px-4">
            <Link
              to="/products"
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              العودة للمنتجات
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">فئة</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {category?.name || 'فئة غير موجودة'}
            </h1>
            {category?.has_offer && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                عروض وخصومات متاحة
              </div>
            )}
            <div className="flex items-center gap-2 mt-4 bg-primary/10 text-primary px-4 py-2 rounded-full w-fit">
              <ShoppingBag className="h-4 w-4" />
              <span className="font-semibold">{categoryProducts.length}</span>
              <span className="text-sm">منتج</span>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/50 mb-6">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد منتجات في هذه الفئة</h3>
                <p className="text-muted-foreground">تحقق لاحقاً!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {categoryProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />
      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
};

export default CategoryPage;
