import { useState, useEffect } from 'react';
import logo from '@/assets/logo.jpg';
import { supabase } from '@/integrations/supabase/client';

const Hero = () => {
  const [heroImageUrl, setHeroImageUrl] = useState('');

  useEffect(() => {
    const fetchHeroImage = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'hero_image_url')
        .maybeSingle();
      if (data?.value) setHeroImageUrl(data.value);
    };
    fetchHeroImage();
  }, []);

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background: image with dark overlay OR gradient fallback */}
      {heroImageUrl ? (
        <>
          <img
            src={heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
      )}

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 animate-fade-in">
            <img 
              src={logo} 
              alt="حكاية ورقة" 
              className="h-32 w-32 object-contain md:h-40 md:w-40 rounded-full"
            />
          </div>
          <h1 className={`mb-4 font-arabic text-4xl font-bold animate-slide-up md:text-5xl lg:text-6xl ${heroImageUrl ? 'text-white' : 'text-primary'}`}>
            حكاية ورقة
          </h1>
          <p className={`mb-2 font-serif text-2xl animate-slide-up md:text-3xl ${heroImageUrl ? 'text-white/90' : 'text-foreground'}`} style={{ animationDelay: '0.1s' }}>
            Hekayet Waraka
          </p>
          <p className={`max-w-xl animate-slide-up ${heroImageUrl ? 'text-white/70' : 'text-muted-foreground'}`} style={{ animationDelay: '0.2s' }}>
            Discover our curated collection of fine stationery, writing instruments, and paper goods. 
            Each piece tells a story waiting to be written.
          </p>
        </div>
      </div>
      
      {/* Decorative elements */}
      {!heroImageUrl && (
        <>
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        </>
      )}
    </section>
  );
};

export default Hero;
