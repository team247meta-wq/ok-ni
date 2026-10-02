import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import MailComposer from 'npm:nodemailer@6.9.14/lib/mail-composer/index.js';

function toBase64Url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const to = String(body.to || '').trim();
    const subject = String(body.subject || 'Báo cáo sổ quỹ').slice(0, 200);
    const html = String(body.html || '').slice(0, 400000);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return Response.json({ error: 'Email người nhận không hợp lệ' }, { status: 400 });
    }
    if (!html) return Response.json({ error: 'Thiếu nội dung báo cáo' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // From = the Gmail account linked to the app (name shown to the recipient).
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = profileRes.ok ? await profileRes.json() : null;
    const fromName = String(body.from_name || 'Sổ quỹ Tổ 2 Tuyển dụng').slice(0, 120);
    const from = profile?.emailAddress ? `"${fromName}" <${profile.emailAddress}>` : undefined;

    const composer = new MailComposer({ to, subject, html, from });
    const message = await new Promise((resolve, reject) => {
      composer.compile().build((err, msg) => (err ? reject(err) : resolve(msg)));
    });

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(message) }),
    });
    const sendData = await sendRes.json();
    if (!sendRes.ok) {
      return Response.json({ error: sendData?.error?.message || 'Gửi email thất bại' }, { status: 502 });
    }

    return Response.json({ ok: true, id: sendData.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}