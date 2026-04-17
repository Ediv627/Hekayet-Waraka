import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpg';

interface SocialSettings {
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<SocialSettings>({
    phone: '',
    email: '',
    facebook: '',
    instagram: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('key, value')
        .in('key', ['store_phone', 'store_email', 'facebook_url', 'instagram_url']);
      
      if (data) {
        const newSettings: SocialSettings = {
          phone: '',
          email: '',
          facebook: '',
          instagram: '',
        };
        data.forEach((item) => {
          if (item.key === 'store_phone') newSettings.phone = item.value;
          if (item.key === 'store_email') newSettings.email = item.value;
          if (item.key === 'facebook_url') newSettings.facebook = item.value;
          if (item.key === 'instagram_url') newSettings.instagram = item.value;
        });
        setSettings(newSettings);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="border-t border-border bg-secondary/30 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-right">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="حكاية ورقة" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <span className="font-arabic text-xl font-semibold text-primary">حكاية ورقة</span>
                <p className="text-xs text-muted-foreground">Hekayet Waraka</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              متجر متخصص في أدوات الكتابة والقرطاسية الفاخرة
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="font-semibold text-foreground">روابط سريعة</h3>
            <nav className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <Link to="/products" className="hover:text-primary transition-colors">المنتجات</Link>
              <Link to="/auth" className="hover:text-primary transition-colors">تسجيل الدخول</Link>
            </nav>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <h3 className="font-semibold text-foreground">تواصل معنا</h3>
            <div className="flex flex-col items-center md:items-end gap-2 text-sm text-muted-foreground">
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <span>{settings.phone}</span>
                  <Phone className="h-4 w-4" />
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <span>{settings.email}</span>
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-4 mt-2">
              {settings.facebook && (
                <a 
                  href={settings.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.instagram && (
                <a 
                  href={settings.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} حكاية ورقة - Hekayet Waraka. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
