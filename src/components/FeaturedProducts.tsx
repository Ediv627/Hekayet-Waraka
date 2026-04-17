import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/button';

const FeaturedProducts = () => {
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 6);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">Featured Products</h2>
          <p className="font-arabic text-lg text-muted-foreground">منتجاتنا المميزة</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-10 text-center">
            <Link to="/products">
              <Button 
                size="lg" 
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {products.length > 6 && (
              <p className="mt-2 text-sm text-muted-foreground">
                +{products.length - 6} more products
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
