# MK5 Activation Production

نسخة جاهزة للنشر على Render مع Discord OAuth.

## Render Environment المطلوب

```env
NODE_ENV=production
BASE_URL=https://mk5-activation.onrender.com
SESSION_SECRET=اكتب_سر_طويل
DISCORD_CLIENT_ID=ايدي_التطبيق
DISCORD_CLIENT_SECRET=السكرت_الجديد
DISCORD_REDIRECT_URI=https://mk5-activation.onrender.com/auth/callback
DISCORD_BOT_TOKEN=توكن_البوت_الجديد
DISCORD_INVITE_URL=https://discord.gg/mk5
WEBHOOK_URL=رابط_الويبهوك
SUCCESS_ADD_ROLE=
SUCCESS_REMOVE_ROLE=
```

## Discord Developer Portal

OAuth2 > Redirects:

```txt
https://mk5-activation.onrender.com/auth/callback
```

Bot page:
- Public Bot: ON
- Requires OAuth2 Code Grant: OFF
- Server Members Intent: ON

## Render

Build Command:
```bash
npm install
```

Start Command:
```bash
node server.js
```

ملاحظة: لا ترفع `.env` ولا `node_modules` إلى GitHub.
