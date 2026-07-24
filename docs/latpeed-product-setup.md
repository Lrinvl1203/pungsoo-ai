# Latpeed Product Setup

Latpeed is being used as the low-fixed-cost Korean checkout path for the first commercial test.

## Live Product

- Product URL: `https://www.latpeed.com/products/XJ8Ul`
- Product name: `우리집 기운이 새는 이유: 청풍명월 공간비방서`
- Price: `9,900원`
- Product image backup: `public/images/products/latpeed-premium-report-thumbnail-v3.png`
- Pre-edit backup: `docs/latpeed-backups/XJ8Ul-before-polish-2026-06-04T02-54-57-434Z.json`

## Important Finding

Latpeed currently does not preserve arbitrary query parameters from:

```text
https://www.latpeed.com/products/XJ8Ul?order_id=...&analysis_id=...
```

into the visible `/pay` URL. Do not assume those values will arrive in webhook payloads.

The commercial MVP flow should therefore use:

```text
https://pungsoo-ai.vercel.app/latpeed/claim
```

as the Latpeed digital content link / delivery URL. The app keeps the temporary order context in browser localStorage when the buyer starts checkout from the app, and the claim page can also recover ownership from a submitted analysisID once the webhook or manual unlock writes a `purchases` row.

## Buyer Survey

Keep this field required in Latpeed:

```text
풍수지리 AI 가입 이메일과 분석ID 또는 분석 결과 페이지 주소를 입력해 주세요.
```

This is the fallback that lets the webhook or operator map a Latpeed buyer to the correct app analysis.

## Vercel Environment

Required:

```text
VITE_PAYMENT_PROVIDER=latpeed
VITE_LATPEED_URL_REPORT=https://www.latpeed.com/products/XJ8Ul
LATPEED_WEBHOOK_SECRET=make-a-long-random-secret
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional future products:

```text
VITE_LATPEED_URL_REMEDY=https://...
VITE_LATPEED_URL_ZODIAC=https://...
VITE_LATPEED_URL_FRAME=https://...
VITE_LATPEED_URL_OBJECT=https://...
```

## Webhook

Set the Latpeed webhook URL to:

```text
https://pungsoo-ai.vercel.app/api/latpeed-webhook?secret=YOUR_LATPEED_WEBHOOK_SECRET
```

The webhook first tries to read explicit metadata:

```text
order_id, order_type, user_id, analysis_id, amount
```

If Latpeed does not provide those fields, it now scans the full payload for a UUID analysisID or analysis result URL. When found, it looks up `analysis_history.id` with the service role key, resolves the owning `user_id`, and inserts/upserts the completed purchase.

## Manual Unlock Fallback

If the webhook payload is not usable, manually insert a purchase after confirming the Latpeed order:

```sql
insert into purchases (
  user_id,
  order_id,
  payment_key,
  amount,
  order_type,
  status,
  analysis_id,
  buyer_name,
  contact_info
) values (
  '<analysis_history.user_id>',
  'latpeed_manual_<latpeed_order_id>',
  'latpeed_manual_<latpeed_order_id>',
  9900,
  'report',
  'COMPLETED',
  '<analysis_history.id>',
  'Latpeed customer',
  '<buyer email or phone>'
);
```

After that, the buyer can refresh `/latpeed/claim` or reopen their analysis result page.
