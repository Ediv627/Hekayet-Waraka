import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { AuthProvider } from "@/context/AuthContext";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CategoryProvider>
        <ProductProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/category/:id" element={<CategoryPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <WhatsAppButton />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </ProductProvider>
      </CategoryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
