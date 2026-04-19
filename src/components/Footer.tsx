import { Link } from "react-router-dom";
import { Facebook, Instagram, Phone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpg";

// Custom TikTok Icon since lucide-react doesn't have one
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface SocialSettings {
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<SocialSettings>({
    phone: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("key, value")
        .in("key", [
          "store_phone",
          "store_email",
          "facebook_url",
          "instagram_url",
          "tiktok_url",
        ]);

      if (data) {
        const newSettings: SocialSettings = {
          phone: "",
          email: "",
          facebook: "",
          instagram: "",
          tiktok: "",
        };
        data.forEach((item) => {
          if (item.key === "store_phone") newSettings.phone = item.value;
          if (item.key === "store_email") newSettings.email = item.value;
          if (item.key === "facebook_url") newSettings.facebook = item.value;
          if (item.key === "instagram_url") newSettings.instagram = item.value;
          if (item.key === "tiktok_url") newSettings.tiktok = item.value;
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
                <span className="font-arabic text-xl font-semibold text-primary">
                  حكاية ورقة
                </span>
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
              <Link to="/" className="hover:text-primary transition-colors">
                الرئيسية
              </Link>
              <Link
                to="/products"
                className="hover:text-primary transition-colors"
              >
                المنتجات
              </Link>
              <Link to="/auth" className="hover:text-primary transition-colors">
                تسجيل الدخول
              </Link>
            </nav>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <h3 className="font-semibold text-foreground">تواصل معنا</h3>
            <div className="flex flex-col items-center md:items-end gap-2 text-sm text-muted-foreground">
              {settings.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <span>{settings.phone}</span>
                  <Phone className="h-4 w-4" />
                </a>
              )}
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
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
              {settings.tiktok && (
                <a
                  href={settings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} حكاية ورقة - Hekayet Waraka. جميع
            الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
