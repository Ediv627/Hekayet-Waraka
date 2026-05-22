import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * يستمع لطلبات جديدة في الوقت الفعلي ويُظهر:
 * - Toast داخل الموقع
 * - صوت تنبيه (WebAudio - بدون ملف خارجي)
 * - إشعار متصفح (Browser Notification)
 * - عدّاد في عنوان التبويبة
 * يعمل فقط للأدمن المسجل دخوله.
 */
const AdminOrderNotifications = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const newCountRef = useRef(0);
  const originalTitleRef = useRef<string>('');
  const mountedAtRef = useRef<number>(Date.now());

  // تشغيل صوت تنبيه باستخدام WebAudio (بدون ملف خارجي)
  const playNotificationSound = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // نغمتين متتاليتين (دينج-دونج)
      const playTone = (freq: number, start: number, duration = 0.25) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(880, 0);
      playTone(1175, 0.18);
      setTimeout(() => ctx.close(), 800);
    } catch (e) {
      // تجاهل في حال منع المتصفح للصوت
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    originalTitleRef.current = document.title;
    mountedAtRef.current = Date.now();

    // طلب إذن إشعارات المتصفح
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // تجاهل الطلبات القديمة التي قد تأتي عند الاتصال الأول
          const created = payload.new?.created_at ? new Date(payload.new.created_at).getTime() : Date.now();
          if (created < mountedAtRef.current - 5000) return;

          const order = payload.new as {
            id: string;
            customer_name: string;
            total: number;
            governorate?: string;
          };

          newCountRef.current += 1;

          // 1) صوت
          playNotificationSound();

          // 2) Toast داخل الموقع
          toast.success('🛒 طلب جديد!', {
            description: `${order.customer_name} • ${Number(order.total).toFixed(2)} جنيه`,
            duration: 8000,
            action: {
              label: 'عرض',
              onClick: () => navigate('/admin/orders'),
            },
          });

          // 3) إشعار المتصفح
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const n = new Notification('طلب جديد 🛒', {
                body: `${order.customer_name} • ${Number(order.total).toFixed(2)} جنيه`,
                tag: `order-${order.id}`,
                icon: '/favicon.ico',
              });
              n.onclick = () => {
                window.focus();
                navigate('/admin/orders');
                n.close();
              };
            } catch (e) {
              // تجاهل
            }
          }

          // 4) عدّاد في عنوان التبويبة
          document.title = `(${newCountRef.current}) ${originalTitleRef.current}`;
        },
      )
      .subscribe();

    // إعادة تعيين العدّاد عند العودة للتبويبة
    const handleVisibility = () => {
      if (!document.hidden) {
        newCountRef.current = 0;
        document.title = originalTitleRef.current;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.title = originalTitleRef.current;
    };
  }, [isAdmin, isAuthenticated, navigate]);

  return null;
};

export default AdminOrderNotifications;
