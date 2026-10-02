import { secrets } from 'base44:runtime';

// Gửi ảnh vào nhóm Telegram đã cấu hình (token + chat id nằm ở secrets của app).
export const sendTelegramPhoto = async ({ photo, caption = '' }) => {
  const token = secrets.get('TELEGRAM_BOT_TOKEN');
  const chatId = secrets.get('TELEGRAM_CHAT_ID');
  if (!token || !chatId) throw new Error('Chưa cấu hình bot Telegram');

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  let res;

  if (typeof photo === 'string') {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo, caption }),
    });
  } else {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption);
    form.append('photo', photo, 'bao-cao.png');
    res = await fetch(url, { method: 'POST', body: form });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data?.description || 'Telegram không nhận được ảnh');
  }
  return data.result;
};