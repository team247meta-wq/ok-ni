import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTelegramPhoto } from '../../shared/telegram.ts';

// Gửi ảnh báo cáo (URL ảnh công khai) vào nhóm Telegram đã cấu hình.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const photo = String(body?.photo_url || '').trim();
    const caption = String(body?.caption || '').slice(0, 1000);

    if (!/^https:\/\//.test(photo)) {
      return Response.json({ error: 'Thiếu ảnh để gửi' }, { status: 400 });
    }

    const result = await sendTelegramPhoto({ photo, caption });
    return Response.json({ ok: true, message_id: result?.message_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}