import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import OrdersManagement from '@/components/admin/OrdersManagement';
import logo from '@/assets/logo.jpg';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, isLoading: authLoading } = useAuth();

  // Access control - redirect non-admin users
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground mb-6">
              {!isAuthenticated 
                ? 'يجب تسجيل الدخول للوصول إلى لوحة التحكم'
                : 'ليس لديك صلاحية الوصول إلى لوحة التحكم'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/">
                <Button variant="outline">المتجر</Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/auth">
                  <Button>تسجيل الدخول</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={logo} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
              <div>
                <h1 className="font-serif text-base sm:text-xl font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  إدارة الطلبات
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">المنتجات</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <OrdersManagement />
      </main>
    </div>
  );
};

export default AdminOrders;
