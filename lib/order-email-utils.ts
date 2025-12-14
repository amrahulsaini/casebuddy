import type { Pool } from 'mysql2/promise';

export type EmailOrderItem = {
  productId: number | null;
  productName: string;
  phoneModel?: string | null;
  designName?: string | null;
  quantity: number;
  customization?: {
    customText?: string;
    font?: string;
    placement?: string;
  };
};

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseItemsFromCustomizationJson(args: {
  customizationData: string | null;
  fallback: EmailOrderItem;
}): EmailOrderItem[] {
  const { customizationData, fallback } = args;
  if (!customizationData) return [fallback];

  try {
    const parsed = JSON.parse(customizationData);

    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items.map((it: any) => ({
        productId:
          it.productId != null
            ? Number(it.productId)
            : it.product_id != null
              ? Number(it.product_id)
              : null,
        productName: it.productName || it.product_name || 'Item',
        phoneModel: it.phoneModel || it.phone_model || null,
        designName: it.designName || it.design_name || null,
        quantity: Math.max(1, parseInt(it.quantity) || 1),
        customization: it.customizationOptions
          ? {
              customText: it.customizationOptions.customText,
              font: it.customizationOptions.font,
              placement: it.customizationOptions.placement,
            }
          : undefined,
      }));
    }

    // Backward-compatible single-item customization payload
    const customText = parsed?.customText;
    const font = parsed?.font;
    const placement = parsed?.placement;
    if (customText || font || placement) {
      return [
        {
          ...fallback,
          customization: {
            customText,
            font,
            placement,
          },
        },
      ];
    }
  } catch {
    // ignore
  }

  return [fallback];
}

export function makeAbsoluteUrl(rawUrl: string, baseUrl: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  if (rawUrl.startsWith('/')) return `${normalizedBase}${rawUrl}`;
  return `${normalizedBase}/${rawUrl}`;
}

export async function fetchPrimaryImagesByProductId(args: {
  pool: Pool;
  productIds: number[];
  baseUrl: string;
}): Promise<Map<number, string>> {
  const { pool, productIds, baseUrl } = args;
  const imageByProductId = new Map<number, string>();

  const unique = Array.from(new Set(productIds.filter((v) => Number.isFinite(v))));
  if (unique.length === 0) return imageByProductId;

  try {
    const placeholders = unique.map(() => '?').join(',');
    const [rows]: any = await pool.query(
      `SELECT product_id, image_url, is_primary, sort_order, id
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      unique
    );

    for (const r of rows || []) {
      const pid = Number(r.product_id);
      const raw = pickString(r.image_url);
      if (!Number.isFinite(pid) || !raw) continue;
      if (!imageByProductId.has(pid)) imageByProductId.set(pid, makeAbsoluteUrl(raw, baseUrl));
    }
  } catch {
    // ignore lookup failures
  }

  return imageByProductId;
}

export function buildItemsHtml(args: {
  items: EmailOrderItem[];
  imageByProductId: Map<number, string>;
}): string {
  const { items, imageByProductId } = args;

  return items
    .map((item) => {
      const customization = item.customization;
      const hasCustomization = !!(customization?.customText || customization?.font || customization?.placement);
      const imgUrl = item.productId != null ? imageByProductId.get(Number(item.productId)) : null;

      const imageHtml = imgUrl
        ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.productName)}" style="width:90px;height:auto;border-radius:10px;border:1px solid #eee;display:block;margin:0 0 10px 0;" />`
        : '';

      return `
        <div class="item">
          ${imageHtml}
          <p style="margin:0 0 6px 0;"><strong>${escapeHtml(item.productName)}</strong></p>
          ${item.phoneModel ? `<p style="margin:0 0 4px 0;">Phone Model: ${escapeHtml(item.phoneModel)}</p>` : ''}
          ${item.designName ? `<p style="margin:0 0 4px 0;">Design: ${escapeHtml(item.designName)}</p>` : ''}
          <p style="margin:0 0 4px 0;">Quantity: ${escapeHtml(item.quantity)}</p>
          ${hasCustomization ? `
            <div class="customization">
              <strong>🎨 Customization:</strong><br/>
              ${customization?.customText ? `Text: "${escapeHtml(customization.customText)}"<br/>` : ''}
              ${customization?.font ? `Font: ${escapeHtml(customization.font)}<br/>` : ''}
              ${customization?.placement ? `Placement: ${escapeHtml(String(customization.placement).replace(/_/g, ' '))}` : ''}
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');
}

export function buildEmailShell(args: {
  title: string;
  subtitle?: string | null;
  bodyHtml: string;
  theme: 'success' | 'info' | 'warning' | 'danger';
}): string {
  const { title, subtitle, bodyHtml, theme } = args;

  const headerBg =
    theme === 'success'
      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
      : theme === 'info'
        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
        : theme === 'warning'
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
          .container { max-width: 640px; margin: 0 auto; padding: 18px; }
          .header { background: ${headerBg}; color: #fff; padding: 22px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 22px; border-radius: 0 0 12px 12px; }
          .card { background: #fff; padding: 16px; margin: 14px 0; border-radius: 10px; border: 1px solid #e5e7eb; }
          .item { padding: 12px 0; border-bottom: 1px solid #eee; }
          .item:last-child { border-bottom: none; }
          .customization { margin-top: 10px; padding: 10px; background: #fff7ed; border-radius: 8px; border-left: 4px solid #fb923c; }
          .footer { text-align: center; margin-top: 16px; color: #6b7280; font-size: 12px; }
          a { color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">${escapeHtml(title)}</h1>
            ${subtitle ? `<p style="margin:8px 0 0 0;">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <div class="content">
            ${bodyHtml}
            <div class="footer">
              <p style="margin:0;">Questions? Contact us at info@casebuddy.co.in</p>
              <p style="margin:6px 0 0 0;">&copy; ${new Date().getFullYear()} CaseBuddy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
