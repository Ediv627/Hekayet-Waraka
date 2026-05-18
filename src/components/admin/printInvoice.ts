// Utility to print an order invoice in a new window
// Keeps all styling self-contained so site CSS does not interfere.

interface PrintItem {
  product_name: string;
  product_price: number;
  product_discount: number;
  quantity: number;
  variant_label?: string | null;
  variant_page_count?: number | null;
}

interface PrintOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  governorate: string;
  city: string;
  full_address: string;
  payment_method: string;
  payment_amount_type?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  items?: PrintItem[];
}

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const paymentLabel = (m: string) =>
  m === 'cod' ? 'الدفع عند الاستلام' : 'فودافون كاش';

export function printOrderInvoice(order: PrintOrder, adminMessage: string) {
  const isHalf =
    order.payment_amount_type === 'half' && order.payment_method === 'vodafone_cash';
  const total = Number(order.total) || 0;
  const paidNow = isHalf ? total / 2 : total;
  const remaining = isHalf ? total - paidNow : 0;
  const shortId = order.id.slice(0, 8).toUpperCase();

  const itemsHtml = (order.items || [])
    .map((it) => {
      const price = it.product_discount
        ? it.product_price - it.product_discount
        : it.product_price;
      const lineTotal = (price * it.quantity).toFixed(2);
      const variant = it.variant_label
        ? ` <span class="variant">📐 ${escapeHtml(it.variant_label)}${
            it.variant_page_count != null ? ` • ${it.variant_page_count} ورقة` : ''
          }</span>`
        : '';
      return `
        <tr>
          <td>${escapeHtml(it.product_name)}${variant}</td>
          <td class="center">${it.quantity}</td>
          <td class="end">${Number(it.product_price).toFixed(2)} ج.م</td>
          <td class="end bold">${lineTotal} ج.م</td>
        </tr>`;
    })
    .join('');

  const messageHtml = adminMessage.trim()
    ? `<div class="message">
         <h3>📝 ملاحظة من المتجر</h3>
         <p>${escapeHtml(adminMessage).replace(/\n/g, '<br/>')}</p>
       </div>`
    : '';

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاتورة #${shortId}</title>
<style>
  @page { size: A5; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    padding: 16px;
    background: #fff;
    font-size: 13px;
    line-height: 1.55;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #c75a93;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .brand h1 {
    margin: 0;
    font-size: 22px;
    color: #c75a93;
    letter-spacing: 0.5px;
  }
  .brand p { margin: 2px 0 0; font-size: 11px; color: #666; }
  .meta { text-align: left; font-size: 11px; }
  .meta .id { font-size: 14px; font-weight: bold; color: #c75a93; }
  .section { margin-bottom: 12px; }
  .section h3 {
    margin: 0 0 6px;
    font-size: 13px;
    color: #c75a93;
    border-right: 3px solid #c75a93;
    padding-right: 8px;
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .grid p { margin: 0; font-size: 12px; }
  .label { color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right; }
  th { background: #faf2f7; color: #c75a93; font-weight: 700; }
  .center { text-align: center; }
  .end { text-align: left; }
  .bold { font-weight: 700; }
  .variant {
    display: inline-block;
    margin-right: 4px;
    padding: 1px 6px;
    background: #faf2f7;
    border: 1px solid #e9c8db;
    border-radius: 4px;
    font-size: 11px;
    color: #c75a93;
  }
  .totals { margin-top: 8px; }
  .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
  .totals .grand {
    border-top: 2px dashed #c75a93;
    margin-top: 6px;
    padding-top: 6px;
    font-size: 15px;
    font-weight: 700;
    color: #c75a93;
  }
  .partial {
    margin-top: 8px;
    border: 1px dashed #f59e0b;
    background: #fff8ec;
    padding: 8px;
    border-radius: 6px;
    font-size: 12px;
  }
  .message {
    margin-top: 12px;
    border: 1px solid #c75a93;
    background: #faf2f7;
    padding: 10px 12px;
    border-radius: 6px;
  }
  .message h3 { margin: 0 0 4px; font-size: 13px; color: #c75a93; }
  .message p { margin: 0; font-size: 12px; white-space: pre-wrap; }
  .footer {
    margin-top: 16px;
    text-align: center;
    font-size: 11px;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 8px;
  }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>حكاية ورقة</h1>
      <p>فاتورة طلب — Hekayet Waraka</p>
    </div>
    <div class="meta">
      <div class="id">#${shortId}</div>
      <div>${formatDate(order.created_at)}</div>
    </div>
  </div>

  <div class="section">
    <h3>بيانات العميل</h3>
    <div class="grid">
      <p><span class="label">الاسم:</span> ${escapeHtml(order.customer_name)}</p>
      <p><span class="label">الهاتف:</span> ${escapeHtml(order.customer_phone)}</p>
      <p><span class="label">المحافظة:</span> ${escapeHtml(order.governorate)}</p>
      <p><span class="label">المدينة:</span> ${escapeHtml(order.city)}</p>
      <p style="grid-column: 1 / -1"><span class="label">العنوان:</span> ${escapeHtml(order.full_address)}</p>
      <p><span class="label">طريقة الدفع:</span> ${paymentLabel(order.payment_method)}${
        order.payment_method === 'vodafone_cash'
          ? ` (${isHalf ? 'دفع 50%' : 'دفع كامل'})`
          : ''
      }</p>
    </div>
  </div>

  <div class="section">
    <h3>المنتجات</h3>
    <table>
      <thead>
        <tr>
          <th>المنتج</th>
          <th class="center">الكمية</th>
          <th class="end">السعر</th>
          <th class="end">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span class="label">المجموع الفرعي</span><span>${Number(order.subtotal).toFixed(2)} ج.م</span></div>
      <div class="row"><span class="label">رسوم التوصيل</span><span>${Number(order.delivery_fee).toFixed(2)} ج.م</span></div>
      <div class="row grand"><span>الإجمالي</span><span>${total.toFixed(2)} ج.م</span></div>
      ${
        isHalf
          ? `<div class="partial">
              <div class="row"><span>💳 مدفوع الآن (فودافون كاش)</span><span class="bold">${paidNow.toFixed(2)} ج.م</span></div>
              <div class="row"><span>📦 المتبقي عند الاستلام</span><span class="bold">${remaining.toFixed(2)} ج.م</span></div>
            </div>`
          : ''
      }
    </div>
  </div>

  ${
    order.notes
      ? `<div class="section"><h3>ملاحظات العميل</h3><p style="margin:0;font-size:12px">${escapeHtml(order.notes)}</p></div>`
      : ''
  }

  ${messageHtml}

  <div class="footer">
    شكراً لثقتك في حكاية ورقة 🌸 — للتواصل: واتساب المتجر
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) {
    alert('من فضلك اسمح بالنوافذ المنبثقة لطباعة الفاتورة');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
