import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Package,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  PackageCheck,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

const phoneRegex = /^01[0125][0-9]{8}$/;

const trackSchema = z.object({
  orderId: z.string().uuid({ message: 'رقم الطلب غير صحيح' }),
  phone: z
    .string()
    .min(11, 'رقم الهاتف يجب أن يكون 11 رقم')
    .max(11, 'رقم الهاتف يجب أن يكون 11 رقم')
    .regex(phoneRegex, 'أدخل رقم هاتف مصري صحيح'),
});

type TrackForm = z.infer<typeof trackSchema>;

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  product_discount: number | null;
  quantity: number;
  variant_label: string | null;
}

interface TrackedOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  governorate: string;
  city: string;
  full_address: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

const STATUS_META: Record<
  TrackedOrder['status'],
  { label: string; icon: any; color: string; description: string }
> = {
  pending: {
    label: 'قيد المراجعة',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description: 'طلبك وصل وبننتظر التأكيد منك أو من فريقنا.',
  },
  confirmed: {
    label: 'تم التأكيد',
    icon: CheckCircle2,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    description: 'الطلب اتأكد وهنبدأ تجهيزه قريباً.',
  },
  processing: {
    label: 'قيد التجهيز',
    icon: Package,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    description: 'بنجهز طلبك دلوقتي 📦',
  },
  shipped: {
    label: 'تم الشحن',
    icon: Truck,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    description: 'الطلب في الطريق إليك 🚚',
  },
  delivered: {
    label: 'تم التوصيل',
    icon: PackageCheck,
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    description: 'تم توصيل الطلب بنجاح. شكراً ليك ❤️',
  },
  cancelled: {
    label: 'ملغي',
    icon: XCircle,
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    description: 'تم إلغاء هذا الطلب.',
  },
};

const STATUS_STEPS: TrackedOrder['status'][] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<TrackForm>({
    resolver: zodResolver(trackSchema),
    defaultValues: { orderId: '', phone: '' },
  });

  const fetchOrder = async (orderId: string, phone: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data, error } = await supabase.rpc('get_order_tracking', {
        _order_id: orderId,
        _phone: phone,
      });
      if (error) throw error;
      if (!data) {
        setOrder(null);
        setNotFound(true);
        return;
      }
      setOrder(data as unknown as TrackedOrder);
    } catch (err) {
      console.error('Track error:', err);
      toast.error('حدث خطأ أثناء البحث عن الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill from query params (e.g., after checkout)
  useEffect(() => {
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    if (id && phone) {
      form.setValue('orderId', id);
      form.setValue('phone', phone);
      fetchOrder(id, phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (values: TrackForm) => {
    fetchOrder(values.orderId, values.phone);
  };

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const { data, error } = await supabase.rpc('cancel_order_by_phone', {
        _order_id: order.id,
        _phone: order.customer_phone,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (result?.success) {
        toast.success('تم إلغاء الطلب بنجاح');
        setOrder({ ...order, status: 'cancelled' });
      } else if (result?.error === 'not_cancellable') {
        toast.error('لا يمكن إلغاء هذا الطلب لأنه تم تأكيده بالفعل');
        await fetchOrder(order.id, order.customer_phone);
      } else {
        toast.error('تعذّر إلغاء الطلب');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error('حدث خطأ أثناء إلغاء الطلب');
    } finally {
      setCancelling(false);
    }
  };

  const StatusIcon = order ? STATUS_META[order.status].icon : Clock;
  const canCancel = order?.status === 'pending';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={logo} alt="حكاية ورقة" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
              <h1 className="font-serif text-base sm:text-xl font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                تتبع الطلب
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-3xl space-y-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-lg">ابحث عن طلبك</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right block">رقم الطلب</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: 8f3a..."
                          className="text-left ltr"
                          dir="ltr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right block">رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="01xxxxxxxxx"
                          className="text-left"
                          dir="ltr"
                          maxLength={11}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  بحث
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Not found */}
        {notFound && !loading && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-6 text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <p className="font-medium">لم نجد طلباً بهذه البيانات</p>
              <p className="text-sm text-muted-foreground mt-1">
                تأكد من رقم الطلب ورقم الهاتف وحاول مرة أخرى.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order details */}
        {order && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="text-right">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    طلب #{order.id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`${STATUS_META[order.status].color} gap-1.5 px-3 py-1.5 text-sm`}
                >
                  <StatusIcon className="h-4 w-4" />
                  {STATUS_META[order.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Status description */}
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-right">
                {STATUS_META[order.status].description}
              </div>

              {/* Status timeline */}
              {order.status !== 'cancelled' && (
                <div className="flex items-center justify-between gap-1 px-1" dir="ltr">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = STATUS_STEPS.indexOf(order.status);
                    const reached = idx <= currentIdx;
                    const Icon = STATUS_META[step].icon;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center relative">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center border-2 z-10 ${
                            reached
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background border-border text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs mt-1.5 text-center ${
                            reached ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {STATUS_META[step].label}
                        </span>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute top-[18px] right-[-50%] left-[50%] h-0.5 ${
                              idx < currentIdx ? 'bg-primary' : 'bg-border'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              {/* Customer info */}
              <div className="space-y-2 text-right text-sm">
                <h3 className="font-semibold">بيانات الشحن</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                  <p><span className="text-foreground">الاسم:</span> {order.customer_name}</p>
                  <p><span className="text-foreground">الهاتف:</span> {order.customer_phone}</p>
                  <p><span className="text-foreground">المحافظة:</span> {order.governorate}</p>
                  <p><span className="text-foreground">المدينة:</span> {order.city}</p>
                  <p className="sm:col-span-2"><span className="text-foreground">العنوان:</span> {order.full_address}</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2 text-right">
                <h3 className="font-semibold text-sm">المنتجات</h3>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const unit = item.product_price - (item.product_discount || 0);
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between items-center rounded-lg border border-border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          {item.variant_label && (
                            <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                          )}
                          <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-primary">
                            {(unit * item.quantity).toFixed(2)} ج.م
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1 text-sm text-right">
                <div className="flex justify-between text-muted-foreground">
                  <span>المجموع الفرعي</span>
                  <span>{Number(order.subtotal).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>رسوم التوصيل</span>
                  <span>{Number(order.delivery_fee).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>الإجمالي</span>
                  <span className="text-primary">{Number(order.total).toFixed(2)} ج.م</span>
                </div>
              </div>

              {/* Cancel action */}
              <div className="pt-2">
                {canCancel ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2">
                        <Ban className="h-4 w-4" />
                        إلغاء الطلب
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">
                          هل أنت متأكد من إلغاء الطلب؟
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء طلبك نهائياً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {cancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : order.status !== 'cancelled' && order.status !== 'delivered' ? (
                  <p className="text-xs text-center text-muted-foreground">
                    لا يمكن إلغاء الطلب بعد تأكيده. للاستفسار تواصل معنا عبر واتساب.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TrackOrder;
