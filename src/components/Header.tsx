import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Home, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo.jpg';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  onCartClick: () => void;
}

const Header = ({ onCartClick }: HeaderProps) => {
  const { totalItems } = useCart();
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'الرئيسية', icon: Home },
    { to: '/products', label: 'المنتجات', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <img 
            src={logo} 
            alt="حكاية ورقة" 
            className="h-10 w-10 md:h-14 md:w-14 object-contain"
          />
          <div className="text-right">
            <h1 className="font-arabic text-base md:text-xl font-bold text-primary">حكاية ورقة</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Hekayet Waraka</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              لوحة التحكم
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{user?.email?.split('@')[0]}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span>دخول</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Cart Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onCartClick}
            className="relative h-10 w-10 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="حكاية ورقة" className="h-10 w-10 object-contain" />
                    <span className="font-bold text-primary">حكاية ورقة</span>
                  </div>
                </div>

                {/* User Info */}
                {isAuthenticated && (
                  <div className="p-4 bg-secondary/30 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{user?.email?.split('@')[0]}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  ))}
                  
                  {isAuthenticated && isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">لوحة التحكم</span>
                    </Link>
                  )}
                </nav>

                {/* Auth Actions */}
                <div className="p-4 border-t border-border">
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full gap-2">
                        <User className="h-4 w-4" />
                        تسجيل الدخول
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
