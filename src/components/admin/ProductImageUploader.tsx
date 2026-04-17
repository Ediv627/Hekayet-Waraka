import { useState, useRef } from 'react';
import { Plus, X, GripVertical, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

const ProductImageUploader = ({ images, onChange, disabled }: ProductImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: يجب أن يكون ملف صورة`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: حجم الصورة يجب أن يكون أقل من 5 ميجابايت`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = validFiles.map(uploadImage);
      const newUrls = await Promise.all(uploadPromises);
      onChange([...images, ...newUrls]);
      toast.success(`تم رفع ${newUrls.length} صورة بنجاح`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء رفع الصور');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">صور المنتج</label>
        <span className="text-xs text-muted-foreground">
          {images.length} صور • اسحب لإعادة الترتيب
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Existing Images */}
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-move",
              index === 0 && "ring-2 ring-primary ring-offset-2",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && "border-primary scale-105",
              !draggedIndex && "border-border/50 hover:border-primary/50"
            )}
          >
            <img
              src={image}
              alt={`صورة ${index + 1}`}
              className="h-full w-full object-cover"
            />
            
            {/* Primary Badge */}
            {index === 0 && (
              <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                رئيسية
              </div>
            )}

            {/* Drag Handle */}
            <div className="absolute top-1.5 left-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeImage(index)}
              disabled={disabled}
              className="absolute bottom-1.5 right-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {/* Order Number */}
            <div className="absolute bottom-1.5 left-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
          </div>
        ))}

        {/* Add Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-200",
            "border-border/50 hover:border-primary/50 hover:bg-primary/5",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          ) : (
            <>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">إضافة صورة</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          أضف صورة واحدة على الأقل للمنتج. الصورة الأولى ستكون الصورة الرئيسية.
        </p>
      )}
    </div>
  );
};

export default ProductImageUploader;
