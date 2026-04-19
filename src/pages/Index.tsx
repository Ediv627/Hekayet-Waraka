import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryCarousel from "@/components/CategoryCarousel";
import FeaturedProducts from "@/components/FeaturedProducts";
import CartSidebar from "@/components/CartSidebar";
import CheckoutDialog from "@/components/CheckoutDialog";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "حكاية ورقة | Hekayet Waraka",
  description: "متجر متخصص في أدوات الكتابة والقرطاسية الفاخرة",
  url: "https://storypapper.lovable.app",
  logo: "https://storypapper.lovable.app/logo.png",
  image: "https://storypapper.lovable.app/logo.png",
};

const Index = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onCartClick={() => setCartOpen(true)} />

      <SEOHead
        title="حكاية ورقة | Hekayet Waraka - أدوات كتابة وقرطاسية فاخرة"
        description="اكتشف مجموعتنا من أدوات الكتابة والقرطاسية الفاخرة. دفاتر، أقلام، وأدوات خط عربي مميزة."
        canonical="https://storypapper.lovable.app/"
        jsonLd={storeJsonLd}
      />
      <main className="flex-1">
        <Hero />
        <CategoryCarousel />
        <FeaturedProducts />
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

export default Index;
