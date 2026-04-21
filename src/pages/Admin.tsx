import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Package,
  LogOut,
  ShieldAlert,
  Tags,
  Loader2,
  Percent,
  Settings,
  Save,
  Truck,
  ClipboardList,
  Upload,
  ArrowUp,
  ArrowDown,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Separator } from "@/components/ui/separator";
import { useProducts } from "@/context/ProductContext";
import { ProductVariant } from "@/types/product";
import { useCategories } from "@/context/CategoryContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/product";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpg";
import ProductImageUploader from "@/components/admin/ProductImageUploader";
import { useProductImages } from "@/hooks/useProductImages";
import { governorates } from "@/data/egyptLocations";

const productSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  price: z.number().min(0.01, "السعر يجب أن يكون أكبر من 0"),
  categoryId: z.string().optional(),
  description: z.string().max(500).optional(),
  discount: z.number().min(0).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const Admin = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isAdmin,
    user,
    signOut,
    isLoading: authLoading,
  } = useAuth();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    saveVariants,
    isLoading: productsLoading,
  } = useProducts();
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading: categoriesLoading,
  } = useCategories();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    image_url?: string;
    display_order: number;
    has_offer: boolean;
  } | null>(null);
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [stockCount, setStockCount] = useState<string>("");
  const { saveImages, fetchImages } = useProductImages(editingProduct?.id);
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("");
  const [branchPickupEnabled, setBranchPickupEnabled] = useState(false);
  const [branchAddress, setBranchAddress] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deliveryFeesDialogOpen, setDeliveryFeesDialogOpen] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState<
    { governorate: string; fee: number }[]
  >([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [subAreas, setSubAreas] = useState<
    { id?: string; governorate: string; area_name: string; fee: number }[]
  >([]);
  const [newSubAreaGov, setNewSubAreaGov] = useState("");
  const [newSubAreaName, setNewSubAreaName] = useState("");
  const [newSubAreaFee, setNewSubAreaFee] = useState("");

  // Fetch store settings on mount
  useEffect(() => {
    const fetchStoreSettings = async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("key, value")
        .in("key", [
          "store_email",
          "store_phone",
          "whatsapp_number",
          "facebook_url",
          "instagram_url",
          "tiktok_url",
          "vodafone_cash_number",
          "free_delivery_threshold",
          "branch_pickup_enabled",
          "hero_image_url",
          "branch_address",
        ]);

      if (!error && data) {
        data.forEach((setting) => {
          if (setting.key === "store_email") setStoreEmail(setting.value);
          else if (setting.key === "store_phone") setStorePhone(setting.value);
          else if (setting.key === "whatsapp_number")
            setWhatsappNumber(setting.value);
          else if (setting.key === "facebook_url")
            setFacebookUrl(setting.value);
          else if (setting.key === "instagram_url")
            setInstagramUrl(setting.value);
          else if (setting.key === "tiktok_url") setTiktokUrl(setting.value);
          else if (setting.key === "vodafone_cash_number")
            setVodafoneCashNumber(setting.value);
          else if (setting.key === "free_delivery_threshold")
            setFreeDeliveryThreshold(setting.value);
          else if (setting.key === "branch_pickup_enabled")
            setBranchPickupEnabled(setting.value === "true");
          else if (setting.key === "hero_image_url")
            setHeroImageUrl(setting.value);
          else if (setting.key === "branch_address")
            setBranchAddress(setting.value);
        });
      }
    };

    const fetchDeliveryFees = async () => {
      const { data, error } = await supabase
        .from("delivery_fees")
        .select("governorate, fee")
        .order("governorate");

      if (!error && data) {
        setDeliveryFees(
          data.map((d) => ({ governorate: d.governorate, fee: Number(d.fee) })),
        );
      }
    };

    const fetchSubAreas = async () => {
      const { data, error } = await supabase
        .from("delivery_sub_areas")
        .select("id, governorate, area_name, fee")
        .order("governorate");

      if (!error && data) {
        setSubAreas(
          data.map((d) => ({
            id: d.id,
            governorate: d.governorate,
            area_name: d.area_name,
            fee: Number(d.fee),
          })),
        );
      }
    };

    if (isAdmin) {
      fetchStoreSettings();
      fetchDeliveryFees();
      fetchSubAreas();
    }
  }, [isAdmin]);

  // Access control - redirect non-admin users
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      categoryId: "",
      description: "",
      discount: 0,
    },
  });

  // Fetch product images when editing
  useEffect(() => {
    const loadProductImages = async () => {
      if (editingProduct?.id) {
        const { data } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", editingProduct.id)
          .order("display_order", { ascending: true });

        if (data && data.length > 0) {
          setProductImages(data.map((img) => img.image_url));
        } else if (editingProduct.image) {
          // Fallback to legacy single image
          setProductImages([editingProduct.image]);
        } else {
          setProductImages([]);
        }
      } else {
        setProductImages([]);
      }
    };

    if (dialogOpen && editingProduct) {
      loadProductImages();
    }
  }, [editingProduct?.id, dialogOpen]);

  const openAddDialog = () => {
    setEditingProduct(null);
    form.reset({
      name: "",
      price: 0,
      categoryId: "",
      description: "",
      discount: 0,
    });
    setProductImages([]);
    setVariants([]);
    setIsAvailable(true);
    setStockCount("");
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId || "",
      description: product.description || "",
      discount: product.discount || 0,
    });
    setVariants(
      product.variants ? product.variants.map((v) => ({ ...v })) : [],
    );
    setIsAvailable(product.isAvailable !== false);
    setStockCount(
      product.stockCount === null || product.stockCount === undefined
        ? ""
        : String(product.stockCount),
    );
    setDialogOpen(true);
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { label: "", price: 0 }]);
  };

  const updateVariant = (
    index: number,
    field: "label" | "price",
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              [field]: field === "price" ? parseFloat(value) || 0 : value,
            }
          : v,
      ),
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Check if at least one image is required for new products
      if (!editingProduct && productImages.length === 0) {
        toast.error("يرجى إضافة صورة واحدة على الأقل للمنتج");
        setIsSubmitting(false);
        return;
      }

      // Validate variants: any non-empty label must have valid price
      for (const v of variants) {
        if (v.label.trim().length > 0 && (isNaN(v.price) || v.price < 0)) {
          toast.error(`سعر الحجم "${v.label}" غير صحيح`);
          setIsSubmitting(false);
          return;
        }
      }

      const parsedStock =
        stockCount.trim() === "" ? null : parseInt(stockCount, 10);
      if (parsedStock !== null && (isNaN(parsedStock) || parsedStock < 0)) {
        toast.error("عدد القطع يجب أن يكون رقم صحيح موجب");
        setIsSubmitting(false);
        return;
      }

      // Primary image is the first one
      const primaryImage = productImages[0] || "";

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: data.name,
          price: data.price,
          image: primaryImage,
          categoryId: data.categoryId || undefined,
          description: data.description || undefined,
          discount: data.discount || 0,
          isAvailable,
          stockCount: parsedStock,
        });

        // Save multiple images
        await saveImages(editingProduct.id, productImages);
        // Save variants
        await saveVariants(editingProduct.id, variants);
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        // First add the product to get the ID
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: data.name,
            price: data.price,
            image: primaryImage,
            category_id: data.categoryId || null,
            description: data.description || null,
            discount: data.discount || 0,
            is_available: isAvailable,
            stock_count: parsedStock,
          })
          .select()
          .single();

        if (error) throw error;

        // Save multiple images
        if (newProduct && productImages.length > 0) {
          await saveImages(newProduct.id, productImages);
        }
        // Save variants
        if (newProduct) {
          await saveVariants(newProduct.id, variants);
        }
        toast.success("تم إضافة المنتج بنجاح");
      }
      setDialogOpen(false);
      form.reset();
      setProductImages([]);
      setVariants([]);
      setIsAvailable(true);
      setStockCount("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء العملية");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteProduct(id);
        toast.success("تم حذف المنتج بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء الحذف");
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        await addCategory(newCategoryName.trim());
        setNewCategoryName("");
        toast.success("تم إضافة الفئة بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء إضافة الفئة");
      }
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && editingCategory.name.trim()) {
      try {
        await updateCategory(editingCategory.id, {
          name: editingCategory.name.trim(),
        });
        setEditingCategory(null);
        toast.success("تم تحديث الفئة بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء تحديث الفئة");
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const hasProducts = products.some((p) => p.categoryId === id);
    if (hasProducts) {
      toast.error("لا يمكن حذف فئة تحتوي على منتجات");
      return;
    }
    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      try {
        await deleteCategory(id);
        toast.success("تم حذف الفئة بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء الحذف");
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!storeEmail.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }

    const thresholdValue = parseFloat(freeDeliveryThreshold) || 0;
    if (thresholdValue < 0) {
      toast.error("حد التوصيل المجاني يجب أن يكون 0 أو أكثر");
      return;
    }

    setIsSettingsSaving(true);
    try {
      const { error } = await supabase.from("store_settings").upsert(
        [
          { key: "store_email", value: storeEmail.trim() },
          { key: "store_phone", value: storePhone.trim() },
          { key: "whatsapp_number", value: whatsappNumber.trim() },
          { key: "facebook_url", value: facebookUrl.trim() },
          { key: "instagram_url", value: instagramUrl.trim() },
          { key: "tiktok_url", value: tiktokUrl.trim() },
          { key: "vodafone_cash_number", value: vodafoneCashNumber.trim() },
          { key: "free_delivery_threshold", value: thresholdValue.toString() },
          {
            key: "branch_pickup_enabled",
            value: branchPickupEnabled.toString(),
          },
          { key: "hero_image_url", value: heroImageUrl.trim() },
          { key: "branch_address", value: branchAddress.trim() },
        ],
        { onConflict: "key" },
      );

      if (error) throw error;
      toast.success("تم حفظ الإعدادات بنجاح");
      setSettingsDialogOpen(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleUpdateDeliveryFee = (governorate: string, newFee: number) => {
    setDeliveryFees((prev) =>
      prev.map((item) =>
        item.governorate === governorate ? { ...item, fee: newFee } : item,
      ),
    );
  };

  const handleSaveDeliveryFees = async () => {
    setIsSavingFees(true);
    try {
      for (const item of deliveryFees) {
        const { error } = await supabase
          .from("delivery_fees")
          .update({ fee: item.fee })
          .eq("governorate", item.governorate);

        if (error) throw error;
      }
      toast.success("تم حفظ أسعار التوصيل بنجاح");
      setDeliveryFeesDialogOpen(false);
    } catch (error) {
      console.error("Error saving delivery fees:", error);
      toast.error("حدث خطأ أثناء حفظ أسعار التوصيل");
    } finally {
      setIsSavingFees(false);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "-";
  };

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
                ? "يجب تسجيل الدخول للوصول إلى لوحة التحكم"
                : "ليس لديك صلاحية الوصول إلى لوحة التحكم"}
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
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src={logo}
                alt="Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
              <div>
                <h1 className="font-serif text-base sm:text-xl font-semibold">
                  لوحة التحكم
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Settings Dialog */}
            <Dialog
              open={settingsDialogOpen}
              onOpenChange={setSettingsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إعدادات المتجر
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      البريد الإلكتروني لاستلام الطلبات
                    </label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      رقم الهاتف (للعرض في الموقع)
                    </label>
                    <Input
                      type="tel"
                      placeholder="01012345678"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      رقم الواتساب (مع كود الدولة)
                    </label>
                    <Input
                      type="tel"
                      placeholder="201012345678"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      مثال: 201012345678 (بدون + أو مسافات)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      رابط صفحة فيسبوك
                    </label>
                    <Input
                      type="url"
                      placeholder="https://facebook.com/yourpage"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      رابط صفحة انستجرام
                    </label>
                    <Input
                      type="url"
                      placeholder="https://instagram.com/yourpage"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      رابط حساب تيك توك
                    </label>
                    <Input
                      type="url"
                      placeholder="https://tiktok.com/@youraccount"
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      رقم فودافون كاش (للتحويلات)
                    </label>
                    <Input
                      type="tel"
                      placeholder="01012345678"
                      value={vodafoneCashNumber}
                      onChange={(e) => setVodafoneCashNumber(e.target.value)}
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      هذا الرقم سيظهر للعملاء عند اختيار الدفع بفودافون كاش
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      حد التوصيل المجاني (ج.م)
                    </label>
                    <Input
                      type="number"
                      placeholder="0 = لا يوجد توصيل مجاني"
                      min="0"
                      step="1"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      الطلبات فوق هذا المبلغ تحصل على توصيل مجاني (0 = لا يوجد
                      توصيل مجاني)
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      صورة خلفية قسم الهيرو
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={heroImageUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setHeroImageUploading(true);
                          try {
                            const fileExt = file.name.split(".").pop();
                            const filePath = `hero/${Date.now()}.${fileExt}`;
                            const { error: uploadError } =
                              await supabase.storage
                                .from("product-images")
                                .upload(filePath, file);
                            if (uploadError) throw uploadError;
                            const { data: urlData } = supabase.storage
                              .from("product-images")
                              .getPublicUrl(filePath);
                            setHeroImageUrl(urlData.publicUrl);
                            toast.success("تم رفع الصورة بنجاح");
                          } catch (err) {
                            console.error(err);
                            toast.error("فشل رفع الصورة");
                          } finally {
                            setHeroImageUploading(false);
                          }
                        }}
                        className="flex-1"
                      />
                      {heroImageUploading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {heroImageUrl && (
                      <div className="relative">
                        <img
                          src={heroImageUrl}
                          alt="Hero preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setHeroImageUrl("")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      اختر صورة لعرضها كخلفية في قسم الهيرو بالصفحة الرئيسية
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        تفعيل الاستلام من الفرع
                      </label>
                      <p className="text-xs text-muted-foreground">
                        يسمح للعملاء باختيار استلام الطلب من الفرع بدلاً من
                        التوصيل
                      </p>
                    </div>
                    <Switch
                      checked={branchPickupEnabled}
                      onCheckedChange={setBranchPickupEnabled}
                    />
                  </div>
                  {branchPickupEnabled && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">عنوان الفرع</label>
                      <Input
                        placeholder="مثال: 15 شارع التحرير، وسط البلد، القاهرة"
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                        dir="rtl"
                      />
                      <p className="text-xs text-muted-foreground">
                        هذا العنوان سيظهر للعميل عند اختيار استلام الطلب من
                        الفرع
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSettingsSaving}
                    className="w-full gap-2"
                  >
                    {isSettingsSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    حفظ الإعدادات
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delivery Fees Dialog */}
            <Dialog
              open={deliveryFeesDialogOpen}
              onOpenChange={setDeliveryFeesDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <Truck className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-serif flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    أسعار التوصيل حسب المحافظة
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
                  <div className="max-h-[35vh] overflow-y-auto space-y-2 pr-2">
                    {deliveryFees.map((item) => (
                      <div
                        key={item.governorate}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border bg-muted/30"
                      >
                        <span className="text-sm font-medium flex-1">
                          {item.governorate}
                        </span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.fee}
                            onChange={(e) =>
                              handleUpdateDeliveryFee(
                                item.governorate,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-24 h-8 text-center"
                            dir="ltr"
                          />
                          <span className="text-xs text-muted-foreground">
                            ج.م
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleSaveDeliveryFees}
                    disabled={isSavingFees}
                    className="w-full gap-2"
                  >
                    {isSavingFees ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    حفظ أسعار التوصيل
                  </Button>

                  {/* Sub-Areas Management */}
                  <Separator />
                  <h4 className="font-medium text-sm">
                    المناطق الفرعية (أسعار توصيل مخصصة)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    أضف مناطق داخل محافظة بأسعار توصيل مختلفة. عند اختيار محافظة
                    لها مناطق، سيظهر للعميل قائمة لاختيار المنطقة.
                  </p>

                  {/* Existing sub-areas */}
                  {subAreas.length > 0 && (
                    <div className="space-y-2">
                      {subAreas.map((area) => (
                        <div
                          key={area.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-secondary/30"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {area.governorate}
                            </span>
                            <span className="text-xs text-muted-foreground mx-1">
                              ›
                            </span>
                            <span className="text-sm">{area.area_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={area.fee}
                              onChange={(e) => {
                                setSubAreas((prev) =>
                                  prev.map((a) =>
                                    a.id === area.id
                                      ? {
                                          ...a,
                                          fee: parseFloat(e.target.value) || 0,
                                        }
                                      : a,
                                  ),
                                );
                              }}
                              className="w-20 h-8 text-center"
                              dir="ltr"
                            />
                            <span className="text-xs text-muted-foreground">
                              ج.م
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={async () => {
                                if (!area.id) return;
                                const { error } = await supabase
                                  .from("delivery_sub_areas")
                                  .delete()
                                  .eq("id", area.id);
                                if (!error) {
                                  setSubAreas((prev) =>
                                    prev.filter((a) => a.id !== area.id),
                                  );
                                  toast.success("تم حذف المنطقة");
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={async () => {
                          setIsSavingFees(true);
                          try {
                            for (const area of subAreas) {
                              if (area.id) {
                                await supabase
                                  .from("delivery_sub_areas")
                                  .update({ fee: area.fee })
                                  .eq("id", area.id);
                              }
                            }
                            toast.success("تم حفظ أسعار المناطق الفرعية");
                          } catch {
                            toast.error("حدث خطأ");
                          } finally {
                            setIsSavingFees(false);
                          }
                        }}
                        disabled={isSavingFees}
                      >
                        <Save className="h-3.5 w-3.5" />
                        حفظ أسعار المناطق
                      </Button>
                    </div>
                  )}

                  {/* Add new sub-area */}
                  <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
                    <label className="text-xs font-medium">
                      إضافة منطقة فرعية جديدة
                    </label>
                    <Select
                      onValueChange={setNewSubAreaGov}
                      value={newSubAreaGov}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="اختر المحافظة" />
                      </SelectTrigger>
                      <SelectContent>
                        {governorates.map((gov) => (
                          <SelectItem key={gov} value={gov}>
                            {gov}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        placeholder="اسم المنطقة"
                        value={newSubAreaName}
                        onChange={(e) => setNewSubAreaName(e.target.value)}
                        className="h-8 flex-1"
                        dir="rtl"
                      />
                      <Input
                        type="number"
                        placeholder="السعر"
                        min="0"
                        value={newSubAreaFee}
                        onChange={(e) => setNewSubAreaFee(e.target.value)}
                        className="h-8 w-20 text-center"
                        dir="ltr"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      disabled={
                        !newSubAreaGov ||
                        !newSubAreaName.trim() ||
                        !newSubAreaFee
                      }
                      onClick={async () => {
                        const fee = parseFloat(newSubAreaFee) || 0;
                        const { data, error } = await supabase
                          .from("delivery_sub_areas")
                          .insert({
                            governorate: newSubAreaGov,
                            area_name: newSubAreaName.trim(),
                            fee,
                          })
                          .select()
                          .single();
                        if (!error && data) {
                          setSubAreas((prev) => [
                            ...prev,
                            {
                              id: data.id,
                              governorate: data.governorate,
                              area_name: data.area_name,
                              fee: Number(data.fee),
                            },
                          ]);
                          setNewSubAreaGov("");
                          setNewSubAreaName("");
                          setNewSubAreaFee("");
                          toast.success("تم إضافة المنطقة");
                        } else {
                          toast.error("حدث خطأ");
                        }
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Categories Dialog */}
            <Dialog
              open={categoryDialogOpen}
              onOpenChange={setCategoryDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 gap-2"
                >
                  <Tags className="h-4 w-4" />
                  <span className="hidden sm:inline">الفئات</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">إدارة الفئات</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Add new category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="اسم الفئة الجديدة..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddCategory()
                      }
                      dir="rtl"
                    />
                    <Button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Categories list */}
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {categoriesLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : categories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        لا توجد فئات بعد
                      </p>
                    ) : (
                      categories.map((category, index) => (
                        <div
                          key={category.id}
                          className="p-3 rounded-lg border border-border bg-card space-y-3"
                        >
                          {editingCategory?.id === category.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editingCategory.name}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full"
                                dir="rtl"
                                placeholder="اسم الفئة"
                              />
                              {/* Image upload */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  صورة الفئة
                                </label>
                                {editingCategory.image_url && (
                                  <img
                                    src={editingCategory.image_url}
                                    alt=""
                                    className="w-full h-24 object-cover rounded-md"
                                  />
                                )}
                                <div className="flex gap-2">
                                  <label className="flex-1">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setCategoryImageUploading(true);
                                        try {
                                          const ext = file.name
                                            .split(".")
                                            .pop();
                                          const path = `categories/${editingCategory.id}-${Date.now()}.${ext}`;
                                          const { error: uploadError } =
                                            await supabase.storage
                                              .from("product-images")
                                              .upload(path, file);
                                          if (uploadError) throw uploadError;
                                          const { data: urlData } =
                                            supabase.storage
                                              .from("product-images")
                                              .getPublicUrl(path);
                                          setEditingCategory({
                                            ...editingCategory,
                                            image_url: urlData.publicUrl,
                                          });
                                        } catch (err) {
                                          console.error(err);
                                          toast.error(
                                            "حدث خطأ أثناء رفع الصورة",
                                          );
                                        } finally {
                                          setCategoryImageUploading(false);
                                        }
                                      }}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full gap-1"
                                      asChild
                                      disabled={categoryImageUploading}
                                    >
                                      <span>
                                        {categoryImageUploading ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Upload className="h-3 w-3" />
                                        )}
                                        {editingCategory.image_url
                                          ? "تغيير الصورة"
                                          : "رفع صورة"}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                              </div>
                              {/* Order */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  الترتيب:
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingCategory.display_order}
                                  onChange={(e) =>
                                    setEditingCategory({
                                      ...editingCategory,
                                      display_order:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 h-8 text-center"
                                />
                              </div>
                              {/* Has offer toggle */}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingCategory.has_offer}
                                  onChange={(e) =>
                                    setEditingCategory({
                                      ...editingCategory,
                                      has_offer: e.target.checked,
                                    })
                                  }
                                  className="rounded"
                                />
                                <Star className="h-4 w-4 text-primary" />
                                <span className="text-sm">عليها عروض</span>
                              </label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await updateCategory(editingCategory.id, {
                                        name: editingCategory.name.trim(),
                                        image_url:
                                          editingCategory.image_url ||
                                          undefined,
                                        display_order:
                                          editingCategory.display_order,
                                        has_offer: editingCategory.has_offer,
                                      });
                                      setEditingCategory(null);
                                      toast.success("تم تحديث الفئة بنجاح");
                                    } catch {
                                      toast.error("حدث خطأ أثناء تحديث الفئة");
                                    }
                                  }}
                                >
                                  حفظ
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCategory(null)}
                                >
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {category.image_url && (
                                <img
                                  src={category.image_url}
                                  alt=""
                                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate block">
                                  {category.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>ترتيب: {category.display_order}</span>
                                  {category.has_offer && (
                                    <span className="text-primary font-medium">
                                      ⭐ عروض
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    if (index > 0) {
                                      const prev = categories[index - 1];
                                      updateCategory(category.id, {
                                        display_order: prev.display_order,
                                      });
                                      updateCategory(prev.id, {
                                        display_order: category.display_order,
                                      });
                                    }
                                  }}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    if (index < categories.length - 1) {
                                      const next = categories[index + 1];
                                      updateCategory(category.id, {
                                        display_order: next.display_order,
                                      });
                                      updateCategory(next.id, {
                                        display_order: category.display_order,
                                      });
                                    }
                                  }}
                                  disabled={index === categories.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setEditingCategory({
                                      id: category.id,
                                      name: category.name,
                                      image_url: category.image_url,
                                      display_order: category.display_order,
                                      has_offer: category.has_offer,
                                    })
                                  }
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteCategory(category.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Product Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openAddDialog}
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">إضافة منتج</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المنتج</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="مثال: دفتر فاخر"
                              dir="rtl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الفئة</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر فئة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover">
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السعر (ج.م)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="25.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            الخصم (ج.م)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وصف المنتج</FormLabel>
                          <FormControl>
                            <textarea
                              className="w-full min-h-[60px] sm:min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                              placeholder="أدخل وصف المنتج..."
                              dir="rtl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <ProductImageUploader
                      images={productImages}
                      onChange={setProductImages}
                      disabled={isSubmitting}
                    />

                    {/* Variants section */}
                    <div className="space-y-3 rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">أحجام المنتج</h4>
                          <p className="text-xs text-muted-foreground">
                            اختياري — اتركها فارغة لاستخدام السعر الأساسي
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addVariant}
                          className="gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          إضافة حجم
                        </Button>
                      </div>
                      {variants.length > 0 && (
                        <div className="space-y-2">
                          {variants.map((v, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <Input
                                placeholder="مثال: A4"
                                value={v.label}
                                onChange={(e) =>
                                  updateVariant(idx, "label", e.target.value)
                                }
                                dir="rtl"
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="السعر"
                                value={isNaN(v.price) ? "" : v.price}
                                onChange={(e) =>
                                  updateVariant(idx, "price", e.target.value)
                                }
                                className="w-28"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeVariant(idx)}
                                className="h-10 w-10 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stock section */}
                    <div className="space-y-3 rounded-lg border border-border p-3">
                      <h4 className="font-medium text-sm">حالة المخزون</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {isAvailable ? "متوفر" : "غير متوفر"}
                        </span>
                        <Switch
                          checked={isAvailable}
                          onCheckedChange={setIsAvailable}
                        />
                      </div>
                      {isAvailable && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">
                            عدد القطع المتاحة (اختياري — فارغ = غير محدود)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="مثال: 5"
                            value={stockCount}
                            onChange={(e) => setStockCount(e.target.value)}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {!isAvailable
                          ? "غير متوفر الآن"
                          : stockCount.trim() === ""
                            ? "متوفر — كمية غير محدودة"
                            : `متوفر — ${parseInt(stockCount, 10) || 0} قطع${
                                (parseInt(stockCount, 10) || 0) <= 5
                                  ? " فقط"
                                  : ""
                              }`}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDialogOpen(false)}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editingProduct ? (
                          "حفظ التغييرات"
                        ) : (
                          "إضافة المنتج"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Link to="/admin/orders">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 gap-2"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">الطلبات</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleLogout}
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Quick Stats / Navigation Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Link to="/admin/orders" className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4 sm:p-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    إدارة الطلبات
                  </p>
                  <p className="text-base sm:text-lg font-semibold">
                    عرض الطلبات
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardContent className="flex items-center gap-3 p-4 sm:p-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  إجمالي المنتجات
                </p>
                <p className="text-base sm:text-lg font-semibold">
                  {products.length} منتج
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Package className="h-5 w-5" />
              المنتجات ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  لا توجد منتجات بعد. أضف أول منتج!
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="grid gap-3 sm:hidden">
                  {products.map((product) => {
                    const finalPrice = product.discount
                      ? product.price - product.discount
                      : product.price;
                    return (
                      <div
                        key={product.id}
                        className="flex gap-3 p-3 rounded-lg border border-border bg-card"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-16 w-16 rounded object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.svg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">
                                {product.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getCategoryName(product.categoryId)}
                              </span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(product)}
                                className="h-7 w-7"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product.id)}
                                className="h-7 w-7 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {product.discount && product.discount > 0 ? (
                              <>
                                <span className="text-primary font-semibold text-sm">
                                  {finalPrice.toFixed(2)} ج.م
                                </span>
                                <span className="text-muted-foreground line-through text-xs">
                                  {product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-sm">
                                {product.price.toFixed(2)} ج.م
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-right">
                        <th className="pb-3 font-medium text-muted-foreground">
                          الصورة
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          الاسم
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          الفئة
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          السعر
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          الخصم
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground text-left">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const finalPrice = product.discount
                          ? product.price - product.discount
                          : product.price;
                        return (
                          <tr
                            key={product.id}
                            className="border-b border-border/50 hover:bg-muted/50"
                          >
                            <td className="py-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-12 w-12 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.svg";
                                }}
                              />
                            </td>
                            <td className="py-3">
                              <div>
                                <span className="font-medium">
                                  {product.name}
                                </span>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {getCategoryName(product.categoryId)}
                            </td>
                            <td className="py-3">
                              {product.discount && product.discount > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground line-through text-sm">
                                    {product.price.toFixed(2)} ج.م
                                  </span>
                                  <span className="text-primary font-semibold">
                                    {finalPrice.toFixed(2)} ج.م
                                  </span>
                                </div>
                              ) : (
                                <span>{product.price.toFixed(2)} ج.م</span>
                              )}
                            </td>
                            <td className="py-3">
                              {product.discount && product.discount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  -{product.discount.toFixed(2)} ج.م
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(product)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(product.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
