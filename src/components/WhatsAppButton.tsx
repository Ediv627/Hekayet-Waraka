import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppButtonProps {
  message?: string;
}

const WhatsAppButton = ({ message = 'مرحباً، أريد الاستفسار عن...' }: WhatsAppButtonProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .single();
      
      if (data?.value) {
        setPhoneNumber(data.value);
      }
    };
    fetchWhatsAppNumber();
  }, []);

  const handleClick = () => {
    if (!phoneNumber) return;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!phoneNumber) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
    </button>
  );
};

export default WhatsAppButton;
