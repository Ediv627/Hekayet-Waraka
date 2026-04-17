import { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Eye, Truck, CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp, Trash2, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Notification sound utility
const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create a pleasant notification sound
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // First tone
  oscillator1.frequency.setValueAtTime(880, audioContext.currentTime); // A5
  oscillator1.type = 'sine';
  
  // Second tone (harmony)
  oscillator2.frequency.setValueAtTime(1108.73, audioContext.currentTime); // C#6
  oscillator2.type = 'sine';
  
  // Volume envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.3);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
  
  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.5);
  oscillator2.stop(audioContext.currentTime + 0.5);
};

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  product_discount: number;
  quantity: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  governorate: string;
  city: string;
  full_address: string;
  payment_method: string;
  transfer_image_url: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: 'مؤكد', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: 'قيد التجهيز', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: <Package className="h-3 w-3" /> },
  shipped: { label: 'تم الشحن', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <Truck className="h-3 w-3" /> },
  delivered: { label: 'تم التوصيل', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: 'ملغي', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
};

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastOrderIdRef = useRef<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          return { ...order, items: items || [] };
        })
      );

      // Track the latest order ID to avoid playing sound on initial load
      if (ordersWithItems.length > 0 && !lastOrderIdRef.current) {
        lastOrderIdRef.current = ordersWithItems[0].id;
      }

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to new orders in realtime
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('New order received:', payload);
          
          // Fetch the complete order with items
          const newOrder = payload.new as Order;
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', newOrder.id);
          
          const orderWithItems = { ...newOrder, items: items || [] };
          
          // Add to orders list
          setOrders(prev => [orderWithItems, ...prev]);
          
          // Play notification sound
          if (soundEnabled && lastOrderIdRef.current) {
            try {
              playNotificationSound();
            } catch (e) {
              console.error('Error playing notification sound:', e);
            }
          }
          
          // Update last order ID
          lastOrderIdRef.current = newOrder.id;
          
          // Show toast notification
          toast.success(`طلب جديد من ${newOrder.customer_name}`, {
            description: `المجموع: ${Number(newOrder.total).toFixed(2)} ج.م`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success('تم تحديث حالة الطلب');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete order items first (due to foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderToDelete.id);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id);

      if (orderError) throw orderError;

      setOrders(prev => prev.filter(order => order.id !== orderToDelete.id));
      toast.success('تم حذف الطلب بنجاح');
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('حدث خطأ أثناء حذف الطلب');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === 'cod' ? 'الدفع عند الاستلام' : 'فودافون كاش';
  };

  // Filter orders based on status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  // Get counts for each status
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 font-serif">
            <Package className="h-5 w-5" />
            الطلبات ({orders.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-2"
              title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{soundEnabled ? 'صوت' : 'صامت'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
          </div>
        </div>
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            الكل ({statusCounts.all})
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(key)}
              className="text-xs gap-1"
            >
              {config.icon}
              <span className="hidden sm:inline">{config.label}</span>
              <span className="sm:hidden">{config.label.slice(0, 6)}</span>
              ({statusCounts[key as keyof typeof statusCounts]})
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {statusFilter === 'all' ? 'لا توجد طلبات بعد' : 'لا توجد طلبات في هذه الحالة'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const status = statusConfig[order.status];

              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  {/* Order Header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm sm:text-base truncate">{order.customer_name}</span>
                          <Badge variant="outline" className={`${status.color} text-xs`}>
                            <span className="flex items-center gap-1">
                              {status.icon}
                              <span className="hidden sm:inline">{status.label}</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {formatDate(order.created_at)} • {order.governorate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 mr-9 sm:mr-0">
                      <span className="font-bold text-primary text-sm sm:text-base">{Number(order.total).toFixed(2)} ج.م</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => {
                            updateOrderStatus(order.id, value as OrderStatus);
                          }}
                        >
                          <SelectTrigger 
                            className="w-24 sm:w-32 h-7 sm:h-8 text-xs sm:text-sm" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => openDeleteDialog(order, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border p-3 sm:p-4 bg-muted/30">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">بيانات العميل</h4>
                          <div className="text-sm space-y-1">
                            <p><span className="text-muted-foreground">الهاتف:</span> {order.customer_phone}</p>
                            <p><span className="text-muted-foreground">العنوان:</span> {order.city}، {order.governorate}</p>
                            <p className="text-xs text-muted-foreground">{order.full_address}</p>
                            <p><span className="text-muted-foreground">الدفع:</span> {getPaymentMethodLabel(order.payment_method)}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">المنتجات</h4>
                          <div className="space-y-1">
                            {order.items?.map((item) => {
                              const itemPrice = item.product_discount
                                ? item.product_price - item.product_discount
                                : item.product_price;
                              return (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{(itemPrice * item.quantity).toFixed(2)} ج.م</span>
                                  <span className="text-right">{item.product_name} × {item.quantity}</span>
                                </div>
                              );
                            })}
                            <Separator className="my-2" />
                            <div className="flex justify-between text-sm">
                              <span>{Number(order.subtotal).toFixed(2)} ج.م</span>
                              <span className="text-muted-foreground">المجموع الفرعي</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>{Number(order.delivery_fee).toFixed(2)} ج.م</span>
                              <span className="text-muted-foreground">التوصيل</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="text-primary">{Number(order.total).toFixed(2)} ج.م</span>
                              <span>الإجمالي</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transfer Image */}
                      {order.transfer_image_url && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">صورة التحويل</h4>
                          <img
                            src={order.transfer_image_url}
                            alt="صورة التحويل"
                            className="max-w-full sm:max-w-xs rounded-lg border border-border"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض التفاصيل
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => openDeleteDialog(order, e)}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف الطلب
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive">تأكيد حذف الطلب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف طلب <strong>{orderToDelete?.customer_name}</strong>؟
              <br />
              سيتم حذف جميع بيانات الطلب ولا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrder}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Trash2 className="h-4 w-4 ml-2" />
              )}
              حذف الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline" className={statusConfig[selectedOrder.status].color}>
                  <span className="flex items-center gap-1">
                    {statusConfig[selectedOrder.status].icon}
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <h3 className="font-medium mb-3">بيانات العميل</h3>
                <div className="grid gap-2 text-sm">
                  <p><span className="text-muted-foreground">الاسم:</span> {selectedOrder.customer_name}</p>
                  <p><span className="text-muted-foreground">الهاتف:</span> {selectedOrder.customer_phone}</p>
                  <p><span className="text-muted-foreground">المحافظة:</span> {selectedOrder.governorate}</p>
                  <p><span className="text-muted-foreground">المدينة:</span> {selectedOrder.city}</p>
                  <p><span className="text-muted-foreground">العنوان:</span> {selectedOrder.full_address}</p>
                  <p><span className="text-muted-foreground">طريقة الدفع:</span> {getPaymentMethodLabel(selectedOrder.payment_method)}</p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-3">المنتجات</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => {
                    const itemPrice = item.product_discount
                      ? item.product_price - item.product_discount
                      : item.product_price;
                    return (
                      <div key={item.id} className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="font-medium">{(itemPrice * item.quantity).toFixed(2)} ج.م</span>
                        <div className="text-right">
                          <span>{item.product_name}</span>
                          <span className="text-muted-foreground"> × {item.quantity}</span>
                          {item.product_discount > 0 && (
                            <span className="text-xs text-green-600 mr-2">
                              (خصم {item.product_discount} ج.م)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{Number(selectedOrder.subtotal).toFixed(2)} ج.م</span>
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                </div>
                <div className="flex justify-between">
                  <span>{Number(selectedOrder.delivery_fee).toFixed(2)} ج.م</span>
                  <span className="text-muted-foreground">التوصيل</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-primary">{Number(selectedOrder.total).toFixed(2)} ج.م</span>
                  <span>الإجمالي</span>
                </div>
              </div>

              {/* Transfer Image */}
              {selectedOrder.transfer_image_url && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">صورة التحويل</h3>
                    <img
                      src={selectedOrder.transfer_image_url}
                      alt="صورة التحويل"
                      className="max-w-full rounded-lg border border-border"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrdersManagement;
