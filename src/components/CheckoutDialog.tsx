import { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Send,
  CheckCircle2,
  Upload,
  Phone,
  Copy,
  Check,
  Image as ImageIcon,
  Truck,
  Store,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart, getCartItemKey } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { Separator } from "@/components/ui/separator";
import { governorates } from "@/data/egyptLocations";
import type { PaymentMethod } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_VODAFONE_CASH_NUMBER = "01012345678";

// Egyptian phone number validation regex
// Accepts formats: 01xxxxxxxxx (11 digits starting with 01)
const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

const checkoutSchema = z
  .object({
    customerName: z
      .string()
      .min(2, "الاسم يجب أن يكون حرفين على الأقل")
      .max(100),
    phone: z
      .string()
      .min(11, "رقم الهاتف يجب أن يكون 11 رقم")
      .max(11, "رقم الهاتف يجب أن يكون 11 رقم")
      .regex(egyptianPhoneRegex, "أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)"),
    deliveryMethod: z.enum(["delivery", "pickup"]),
    governorate: z.string().optional(),
    city: z.string().optional(),
    address: z.string().max(500).optional(),
    paymentMethod: z.enum(["cod", "vodafone_cash"]),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "delivery") {
      if (!data.governorate || data.governorate.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اختر المحافظة",
          path: ["governorate"],
        });
      }
      if (!data.city || data.city.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "أدخل المدينة",
          path: ["city"],
        });
      }
      if (!data.address || data.address.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "أدخل العنوان بالتفصيل (10 أحرف على الأقل)",
          path: ["address"],
        });
      }
    }
  });

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

const CheckoutDialog = ({ open, onClose }: CheckoutDialogProps) => {
  const { items, totalPrice, clearCart, removeFromCart } = useCart();
  const { products } = useProducts();
  const [orderSent, setOrderSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [transferImagePreview, setTransferImagePreview] = useState<
    string | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState(
    DEFAULT_VODAFONE_CASH_NUMBER,
  );
  const [subAreas, setSubAreas] = useState<
    { area_name: string; fee: number }[]
  >([]);
  const [selectedSubArea, setSelectedSubArea] = useState("");
  const [branchPickupEnabled, setBranchPickupEnabled] = useState(false);
  const [branchAddress, setBranchAddress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      deliveryMethod: "delivery",
      governorate: "",
      city: "",
      address: "",
      paymentMethod: "cod",
    },
  });

  const selectedGovernorate = useWatch({
    control: form.control,
    name: "governorate",
  });
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });
  const selectedDeliveryMethod = useWatch({
    control: form.control,
    name: "deliveryMethod",
  });
  const isPickup = selectedDeliveryMethod === "pickup";

  // Fetch sub-areas when governorate changes
  useEffect(() => {
    const fetchSubAreas = async () => {
      if (!selectedGovernorate) {
        setSubAreas([]);
        setSelectedSubArea("");
        return;
      }
      const { data } = await supabase
        .from("delivery_sub_areas")
        .select("area_name, fee")
        .eq("governorate", selectedGovernorate);

      if (data && data.length > 0) {
        setSubAreas(
          data.map((d) => ({ area_name: d.area_name, fee: Number(d.fee) })),
        );
      } else {
        setSubAreas([]);
      }
      setSelectedSubArea("");
    };
    fetchSubAreas();
  }, [selectedGovernorate]);

  // Check if free delivery applies
  const isFreeDelivery =
    freeDeliveryThreshold > 0 && totalPrice >= freeDeliveryThreshold;

  // Calculate actual delivery fee based on governorate and sub-area
  const getDeliveryFee = () => {
    if (isPickup) return 0;
    if (isFreeDelivery) return 0;
    if (subAreas.length > 0 && selectedSubArea) {
      const area = subAreas.find((a) => a.area_name === selectedSubArea);
      return area ? area.fee : 0;
    }
    return deliveryFees[selectedGovernorate] || deliveryFee;
  };
  const actualDeliveryFee = getDeliveryFee();

  // Calculate final total with delivery fee
  const finalTotal = totalPrice + actualDeliveryFee;

  // Fetch delivery settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      // Fetch free delivery threshold
      const { data: thresholdData } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "free_delivery_threshold")
        .maybeSingle();

      if (thresholdData) {
        setFreeDeliveryThreshold(parseFloat(thresholdData.value) || 0);
      }

      // Fetch Vodafone Cash number
      const { data: vodafoneData } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "vodafone_cash_number")
        .maybeSingle();

      if (vodafoneData && vodafoneData.value) {
        setVodafoneCashNumber(vodafoneData.value);
      }

      // Fetch branch pickup setting and address
      const { data: pickupData } = await supabase
        .from("store_settings")
        .select("key, value")
        .in("key", ["branch_pickup_enabled", "branch_address"]);

      if (pickupData) {
        pickupData.forEach((s) => {
          if (s.key === "branch_pickup_enabled")
            setBranchPickupEnabled(s.value === "true");
          if (s.key === "branch_address") setBranchAddress(s.value);
        });
      }

      // Fetch per-governorate delivery fees
      const { data: feesData } = await supabase
        .from("delivery_fees")
        .select("governorate, fee");

      if (feesData) {
        const feesMap: Record<string, number> = {};
        feesData.forEach((item) => {
          feesMap[item.governorate] = Number(item.fee);
        });
        setDeliveryFees(feesMap);

        // Set default fee (average or first one)
        if (feesData.length > 0) {
          const avgFee =
            feesData.reduce((sum, item) => sum + Number(item.fee), 0) /
            feesData.length;
          setDeliveryFee(avgFee);
        }
      }
    };

    if (open) {
      fetchSettings();
    }
  }, [open]);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(vodafoneCashNumber);
      setCopied(true);
      toast.success("تم نسخ الرقم");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل نسخ الرقم");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("يرجى رفع صورة فقط");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }
      setTransferImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setTransferImage(null);
    setTransferImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    // Validate availability of items in cart against latest product data
    const unavailableItems = items.filter((item) => {
      const latest = products.find((p) => p.id === item.id);
      if (!latest) return false;
      if (latest.isAvailable === false) return true;
      if (typeof latest.stockCount === "number" && latest.stockCount === 0)
        return true;
      return false;
    });

    if (unavailableItems.length > 0) {
      unavailableItems.forEach((item) => {
        removeFromCart(getCartItemKey(item));
      });
      toast.error(
        `بعض المنتجات لم تعد متوفرة وتم إزالتها من السلة: ${unavailableItems.map((i) => i.name).join("، ")}`,
      );
      return;
    }

    // Validate transfer image for Vodafone Cash
    if (data.paymentMethod === "vodafone_cash" && !transferImage) {
      toast.error("يرجى رفع صورة إيصال التحويل");
      return;
    }

    setIsSubmitting(true);

    // Convert image to base64 for server-side upload (bypasses client RLS restrictions)
    let transferImageBase64: string | null = null;
    let transferImageType: string | null = null;

    if (transferImage && data.paymentMethod === "vodafone_cash") {
      try {
        const arrayBuffer = await transferImage.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        transferImageBase64 = btoa(binary);
        transferImageType = transferImage.type;
      } catch (error) {
        console.error("Error converting image to base64:", error);
        toast.error("حدث خطأ أثناء معالجة صورة التحويل");
        setIsSubmitting(false);
        return;
      }
    }

    const paymentDetails = {
      method: data.paymentMethod as PaymentMethod,
      ...(data.paymentMethod === "vodafone_cash" && {
        vodafoneCashNumber: vodafoneCashNumber,
        transferImageBase64,
        transferImageType,
      }),
    };

    // Ensure all numeric values are valid numbers >= 0
    const safeSubtotal =
      typeof totalPrice === "number" && !isNaN(totalPrice)
        ? Math.max(0, totalPrice)
        : 0;
    const safeDeliveryFee =
      typeof actualDeliveryFee === "number" && !isNaN(actualDeliveryFee)
        ? Math.max(0, actualDeliveryFee)
        : 0;
    const safeTotal =
      typeof finalTotal === "number" && !isNaN(finalTotal)
        ? Math.max(0, finalTotal)
        : 0;

    const orderDetails = {
      customer: {
        name: data.customerName,
        phone: data.phone,
      },
      deliveryAddress: isPickup
        ? {
            governorate: "استلام من الفرع",
            city: "استلام من الفرع",
            fullAddress: "استلام من الفرع",
          }
        : {
            governorate: data.governorate || "",
            city: data.city || "",
            fullAddress: data.address || "",
          },
      payment: paymentDetails,
      items: items.map((item) => ({
        name: item.name,
        price:
          typeof item.price === "number" && !isNaN(item.price)
            ? Math.max(0, item.price)
            : 0,
        discount:
          typeof item.discount === "number" && !isNaN(item.discount)
            ? Math.max(0, item.discount)
            : 0,
        quantity:
          typeof item.quantity === "number" && !isNaN(item.quantity)
            ? Math.max(1, item.quantity)
            : 1,
      })),
      subtotal: safeSubtotal,
      deliveryFee: safeDeliveryFee,
      isFreeDelivery,
      total: safeTotal,
      orderDate: new Date().toISOString(),
    };

    try {
      // Create order id on client to avoid needing SELECT permission on orders (RLS blocks SELECT for non-admin)
      const orderId = crypto.randomUUID();

      // Upload transfer image if exists
      let transferImageUrl: string | null = null;
      if (transferImage && data.paymentMethod === "vodafone_cash") {
        try {
          const fileExt = transferImage.name.split(".").pop() || "jpg";
          const fileName = `transfers/${orderId}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, transferImage, {
              contentType: transferImage.type,
              upsert: false,
            });

          if (uploadError) {
            console.error("Error uploading transfer image:", uploadError);
          } else {
            const {
              data: { publicUrl },
            } = supabase.storage.from("product-images").getPublicUrl(fileName);
            transferImageUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.error("Error processing transfer image:", uploadErr);
        }
      }

      // Save order to database (no .select() to avoid RLS SELECT restriction)
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        customer_name: data.customerName,
        customer_phone: data.phone,
        governorate: isPickup ? "استلام من الفرع" : data.governorate || "",
        city: isPickup ? "استلام من الفرع" : data.city || "",
        full_address: isPickup ? "استلام من الفرع" : data.address || "",
        payment_method: data.paymentMethod,
        subtotal: totalPrice,
        delivery_fee: actualDeliveryFee,
        total: finalTotal,
        status: "pending",
        transfer_image_url: transferImageUrl,
      });

      if (orderError) throw orderError;

      // Save order items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        product_discount: item.discount || 0,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send email notification
      const { error } = await supabase.functions.invoke("send-order-email", {
        body: orderDetails,
      });

      if (error) {
        console.error("Error sending order email:", error);
        // Don't fail the order if email fails
      }

      console.log("Order saved successfully:", orderId);
      setOrderSent(true);
      clearCart();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (orderSent) {
      setOrderSent(false);
      form.reset();
      setTransferImage(null);
      setTransferImagePreview(null);
      setSelectedSubArea("");
      setSubAreas([]);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {orderSent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mb-2 font-serif text-2xl font-semibold">
              تم إرسال الطلب!
            </h2>
            <p className="mb-2 text-muted-foreground">تم استلام طلبك بنجاح</p>
            <p className="mb-6 font-arabic text-lg text-primary">
              سنتواصل معك قريباً لتأكيد الطلب
            </p>
            <Button className="mt-6" onClick={handleClose}>
              متابعة التسوق
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-right">
                إتمام الطلب
              </DialogTitle>
            </DialogHeader>

            {/* Order Summary */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <h3 className="mb-3 font-medium text-right">ملخص الطلب</h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const itemPrice = item.discount
                    ? item.price - item.discount
                    : item.price;
                  const itemTotal = itemPrice * item.quantity;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {itemTotal.toFixed(2)} ج.م
                        </span>
                        {item.discount && item.discount > 0 && (
                          <span className="text-xs text-green-600">
                            (-{(item.discount * item.quantity).toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm">
                <span>{totalPrice.toFixed(2)} ج.م</span>
                <span>المجموع الفرعي</span>
              </div>

              {/* Delivery Fee Section */}
              {isPickup ? (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-primary font-medium flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    استلام من الفرع
                  </span>
                  <span>التوصيل</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm items-center">
                  {isFreeDelivery ? (
                    <>
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <span className="line-through text-muted-foreground mr-1">
                          {(
                            deliveryFees[selectedGovernorate] || deliveryFee
                          ).toFixed(2)}{" "}
                          ج.م
                        </span>
                        مجاني! 🎉
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        التوصيل
                      </span>
                    </>
                  ) : selectedGovernorate ? (
                    <>
                      <span>{actualDeliveryFee.toFixed(2)} ج.م</span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        التوصيل ({selectedSubArea || selectedGovernorate})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground text-xs">
                        اختر المحافظة
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        التوصيل
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Free Delivery Info */}
              {!isPickup && freeDeliveryThreshold > 0 && !isFreeDelivery && (
                <div className="mt-2 p-2 rounded-md bg-primary/10 text-xs text-center">
                  🚚 أضف {(freeDeliveryThreshold - totalPrice).toFixed(2)} ج.م
                  للحصول على توصيل مجاني!
                </div>
              )}

              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-primary">
                  {finalTotal.toFixed(2)} ج.م
                </span>
                <span>الإجمالي</span>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right block">
                        الاسم الكامل
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسمك الكامل"
                          className="text-right"
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
                      <FormLabel className="text-right block">
                        رقم الهاتف
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="01xxxxxxxxx"
                          className="text-right"
                          dir="ltr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Method Choice */}
                {branchPickupEnabled && (
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right block">
                          طريقة الاستلام
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-3"
                            dir="rtl"
                          >
                            <div className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                              <RadioGroupItem
                                value="delivery"
                                id="delivery_method"
                              />
                              <Label
                                htmlFor="delivery_method"
                                className="flex-1 cursor-pointer font-medium flex items-center gap-2"
                              >
                                <Truck className="h-4 w-4" />
                                توصيل للمنزل
                              </Label>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                              <RadioGroupItem
                                value="pickup"
                                id="pickup_method"
                              />
                              <Label
                                htmlFor="pickup_method"
                                className="flex-1 cursor-pointer font-medium flex items-center gap-2"
                              >
                                <Store className="h-4 w-4" />
                                استلام من الفرع
                              </Label>
                            </div>
                            {isPickup && branchAddress && (
                              <div className="mr-8 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                                <p className="font-medium mb-1">
                                  📍 عنوان الفرع:
                                </p>
                                <p className="text-muted-foreground">
                                  {branchAddress}
                                </p>
                              </div>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Address fields - hidden when pickup */}
                {!isPickup && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right block">
                              المدينة
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل المدينة"
                                className="text-right"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="governorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right block">
                              المحافظة
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {governorates.map((gov) => (
                                  <SelectItem key={gov} value={gov}>
                                    {gov}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Sub-area dropdown - only shown when governorate has sub-areas */}
                    {subAreas.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-right block">
                          المنطقة
                        </label>
                        <Select
                          onValueChange={setSelectedSubArea}
                          value={selectedSubArea}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنطقة" />
                          </SelectTrigger>
                          <SelectContent>
                            {subAreas.map((area) => (
                              <SelectItem
                                key={area.area_name}
                                value={area.area_name}
                              >
                                {area.area_name} - {area.fee} ج.م توصيل
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Delivery fee disclaimer */}
                    {selectedGovernorate && (
                      <div
                        role="note"
                        className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-right"
                      >
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          يا صديقي 😊 اعلم إن ده متوسط شحن وممكن يكون فيه زيادة
                          أو نقصان، وهيتم تبليغك بعد ما تطلب الأوردر بحوالي
                          ساعتين أو أكتر.
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">
                            العنوان بالتفصيل
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="أدخل عنوانك بالتفصيل (الشارع - رقم المبنى - الشقة)"
                              className="min-h-[80px] text-right"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <Separator />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right block">
                        طريقة الدفع
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                          dir="rtl"
                        >
                          <div className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="cod" id="cod" />
                            <Label
                              htmlFor="cod"
                              className="flex-1 cursor-pointer font-medium"
                            >
                              الدفع عند الاستلام
                            </Label>
                          </div>
                          <div className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <RadioGroupItem
                              value="vodafone_cash"
                              id="vodafone_cash"
                            />
                            <Label
                              htmlFor="vodafone_cash"
                              className="flex-1 cursor-pointer font-medium"
                            >
                              فودافون كاش
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vodafone Cash Section */}
                {selectedPaymentMethod === "vodafone_cash" && (
                  <div className="space-y-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        حوّل المبلغ على الرقم التالي:
                      </p>
                      <div className="flex items-center justify-center gap-2 bg-background rounded-lg p-3 border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyNumber}
                          className="h-8 w-8 p-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <span
                          className="text-xl font-bold text-primary tracking-wider"
                          dir="ltr"
                        >
                          {vodafoneCashNumber}
                        </span>
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-lg font-bold text-primary mt-2">
                        المبلغ المطلوب: {finalTotal.toFixed(2)} ج.م
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium text-right mb-3">
                        ارفع صورة إيصال التحويل:
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className="hidden"
                        id="transfer-image"
                      />

                      {!transferImagePreview ? (
                        <label
                          htmlFor="transfer-image"
                          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-background p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <div className="rounded-full bg-primary/10 p-3">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium">اضغط لرفع الصورة</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG حتى 5 ميجابايت
                            </p>
                          </div>
                        </label>
                      ) : (
                        <div className="relative rounded-lg overflow-hidden border">
                          <img
                            src={transferImagePreview}
                            alt="صورة التحويل"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeImage}
                            >
                              حذف الصورة
                            </Button>
                          </div>
                          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting ? (
                    "جاري إرسال الطلب..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      تأكيد الطلب
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
