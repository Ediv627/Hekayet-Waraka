import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const OrderItemSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().nonnegative().finite(),
  discount: z.number().min(0).finite().optional(),

  quantity: z.number().int().positive().max(1000)
});

const OrderDetailsSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(1).max(20)
  }),
  deliveryAddress: z.object({
    governorate: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    fullAddress: z.string().min(10).max(500)
  }),
  payment: z.object({
    method: z.enum(['cod', 'vodafone_cash', 'instapay', 'partial']),
    prepaidAmount: z.number().nonnegative().optional(),
    remainingAmount: z.number().nonnegative().optional(),
    prepaidVia: z.string().optional(),
    transferImageBase64: z.string().optional(),
    transferImageType: z.string().optional(),
    vodafoneCashNumber: z.string().optional()
  }),
  items: z.array(OrderItemSchema).min(1).max(100),
  subtotal: z.number().nonnegative().finite().optional(),
  deliveryFee: z.number().nonnegative().finite().optional(),
  isFreeDelivery: z.boolean().optional(),
  total: z.number().nonnegative().finite(),
  orderDate: z.string()
});

type OrderDetails = z.infer<typeof OrderDetailsSchema>;

// HTML escape function to prevent XSS
const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send order email");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // IP-based rate limiting (guest checkout friendly)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitKey = `order_email:${clientIP}`;
    
    console.log("Rate limit check for:", rateLimitKey);

    // Check rate limit: max 5 orders per hour per IP
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentRequests, error: rateLimitError } = await supabase
      .from('rate_limit_log')
      .select('created_at')
      .eq('identifier', rateLimitKey)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // Continue without rate limiting if there's an error
    } else if (recentRequests && recentRequests.length >= 5) {
      console.warn("Rate limit exceeded for:", rateLimitKey);
      return new Response(
        JSON.stringify({ error: 'Too many orders. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this request for rate limiting
    await supabase
      .from('rate_limit_log')
      .insert({ identifier: rateLimitKey });

    // Cleanup old rate limit entries (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
    await supabase
      .from('rate_limit_log')
      .delete()
      .lt('created_at', twoHoursAgo);

    // Parse and validate order data
    const rawData = await req.json();
    const validationResult = OrderDetailsSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid order data', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderDetails: OrderDetails = validationResult.data;
    console.log("Order validated successfully");

    // Handle transfer image upload using service role (server-side)
    let transferImageUrl: string | null = null;
    
    if (orderDetails.payment.method === 'vodafone_cash' && orderDetails.payment.transferImageBase64) {
      try {
        const base64Data = orderDetails.payment.transferImageBase64;
        const imageType = orderDetails.payment.transferImageType || 'image/jpeg';

        // Upload the image for admin review
        const fileExt = imageType.split('/')[1] || 'jpg';
        const fileName = `transfer_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Decode base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload using service role (bypasses RLS)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`transfers/${fileName}`, bytes, {
            contentType: imageType,
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading transfer image:", uploadError);
        } else {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('product-images')
            .createSignedUrl(`transfers/${fileName}`, 604800);
          
          if (signedUrlError) {
            console.error("Error creating signed URL:", signedUrlError);
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(`transfers/${fileName}`);
            transferImageUrl = publicUrl;
          } else {
            transferImageUrl = signedUrlData.signedUrl;
          }
          console.log("Transfer image uploaded successfully");
        }
      } catch (uploadErr) {
        console.error("Error processing transfer image:", uploadErr);
      }
    }

    // Use fixed email address (Resend test mode limitation - can only send to verified email)
    // This email receives ALL order notifications
    const storeEmail = "elbialaymhmd@gmail.com";
    console.log("Sending email to:", storeEmail);

    // Format payment method with HTML escaping
    const formatPaymentMethod = (method: string) => {
      const methods: Record<string, string> = {
        cod: "الدفع عند الاستلام",
        vodafone_cash: "فودافون كاش",
        instapay: "انستاباي",
        partial: "دفع جزئي (30%)",
      };
      return methods[method] || escapeHtml(method);
    };

    // Create items HTML with proper escaping
    const itemsHtml = orderDetails.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ${item.discount && item.discount > 0 ? `<span style="text-decoration: line-through; color: #999;">${item.price.toFixed(2)} ج.م</span> → ${(item.price - item.discount).toFixed(2)} ج.م` : `${item.price.toFixed(2)} ج.م`}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ${((item.price - (item.discount || 0)) * item.quantity).toFixed(2)} ج.م
          </td>
        </tr>
      `
      )
      .join("");

    // Payment info section with escaping
    let paymentInfoHtml = `<p><strong>طريقة الدفع:</strong> ${formatPaymentMethod(orderDetails.payment.method)}</p>`;
    if (orderDetails.payment.method === "partial") {
      paymentInfoHtml += `
        <p><strong>المبلغ المدفوع مقدماً (30%):</strong> ${orderDetails.payment.prepaidAmount?.toFixed(2) || '0.00'} ج.م عبر ${formatPaymentMethod(orderDetails.payment.prepaidVia || "")}</p>
        <p><strong>المبلغ المتبقي عند الاستلام:</strong> ${orderDetails.payment.remainingAmount?.toFixed(2) || '0.00'} ج.م</p>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .section { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .section h3 { margin-top: 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #667eea; color: white; padding: 12px; text-align: right; }
          .total { font-size: 1.3em; color: #667eea; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 طلب جديد!</h1>
            <p>تم استلام طلب جديد من متجرك</p>
          </div>
          <div class="content">
            <div class="section">
              <h3>📋 معلومات العميل</h3>
              <p><strong>الاسم:</strong> ${escapeHtml(orderDetails.customer.name)}</p>
              <p><strong>رقم الهاتف:</strong> ${escapeHtml(orderDetails.customer.phone)}</p>
            </div>
            
            <div class="section">
              <h3>📍 عنوان التوصيل</h3>
              <p><strong>المحافظة:</strong> ${escapeHtml(orderDetails.deliveryAddress.governorate)}</p>
              <p><strong>المدينة:</strong> ${escapeHtml(orderDetails.deliveryAddress.city)}</p>
              <p><strong>العنوان بالتفصيل:</strong> ${escapeHtml(orderDetails.deliveryAddress.fullAddress)}</p>
            </div>
            
            <div class="section">
              <h3>💳 معلومات الدفع</h3>
              ${paymentInfoHtml}
              ${transferImageUrl ? `
                <div style="margin-top: 15px;">
                  <p><strong>صورة إيصال التحويل:</strong></p>
                  <a href="${transferImageUrl}" target="_blank" style="display: inline-block; margin-top: 8px;">
                    <img src="${transferImageUrl}" alt="إيصال التحويل" style="max-width: 300px; max-height: 300px; border: 1px solid #ddd; border-radius: 8px;" />
                  </a>
                </div>
              ` : ''}
            </div>
            
            <div class="section">
              <h3>📦 المنتجات المطلوبة</h3>
              <table>
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="margin-top: 15px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                ${orderDetails.subtotal ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>المجموع الفرعي:</span>
                  <span>${orderDetails.subtotal.toFixed(2)} ج.م</span>
                </div>` : ''}
                ${orderDetails.deliveryFee !== undefined ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>🚚 التوصيل${orderDetails.isFreeDelivery ? ' (مجاني!)' : ''}:</span>
                  <span>${orderDetails.isFreeDelivery ? '<span style="color: #22c55e; font-weight: bold;">مجاني 🎉</span>' : `${orderDetails.deliveryFee.toFixed(2)} ج.م`}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; border-top: 2px solid #667eea; padding-top: 10px; margin-top: 8px;">
                  <span class="total">الإجمالي الكلي:</span>
                  <span class="total">${orderDetails.total.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>🕐 وقت الطلب</h3>
              <p>${new Date(orderDetails.orderDate).toLocaleString("ar-EG", { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
          <div class="footer">
            <p>تم إرسال هذا الإيميل تلقائياً من نظام المتجر</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Store Orders <onboarding@resend.dev>",
      to: [storeEmail],
      subject: `🛒 طلب جديد من ${escapeHtml(orderDetails.customer.name)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
