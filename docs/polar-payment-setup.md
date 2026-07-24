# Polar payment setup

Polar is the recommended main checkout path for 41pungsoo AI. Latpeed, Paddle, and Toss can stay in the codebase as fallback providers, but production should use:

```env
VITE_PAYMENT_PROVIDER=polar
```

## Products

Create one-time digital products in Polar > Products > Catalogue.

Recommended product IDs to create/copy:

- `41pungsoo_premium_report` - 9,900 KRW - maps to `POLAR_PRODUCT_ID_REPORT`
- `41pungsoo_remedy_artwork` - 9,900 KRW - maps to `POLAR_PRODUCT_ID_REMEDY`
- `41pungsoo_zodiac_object_blueprint` - 9,900 KRW - maps to `POLAR_PRODUCT_ID_ZODIAC`

The current app only needs `POLAR_PRODUCT_ID_REPORT` for the premium report path. Add the other two when those upsells are ready for live sales.

## Environment variables

Set these in `.env.local` for local testing and in Vercel Project Settings > Environment Variables for production.

```env
VITE_PAYMENT_PROVIDER=polar
POLAR_ENV=production
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_WEBHOOK_SECRET=polar_whs_...
POLAR_CHECKOUT_CURRENCY=krw
POLAR_PRODUCT_ID_REPORT=
POLAR_PRODUCT_ID_REMEDY=
POLAR_PRODUCT_ID_ZODIAC=
```

Use a Polar Organization Access Token with checkout read/write permissions. Keep it server-side only. Do not put it in any `VITE_` variable or client HTML.

## Webhook

Add a Polar webhook endpoint:

```text
https://41pungsoo-ai.vercel.app/api/polar-webhook
```

Settings:

- Format: `Raw`
- Events: `order.paid`, `order.refunded`
- Secret: copy into `POLAR_WEBHOOK_SECRET`

The app also confirms the checkout from `/payment/success`, so users unlock immediately after returning from Polar. The webhook is still important as the durable backup if the user closes the tab before returning. The refund webhook is required so refunded orders are locked again and the customer refund timeline is marked complete.

## Operator flow

Customer purchase:

1. Customer lands on the site, logs in, runs the free analysis, and opens the premium report lock.
2. The app creates a Polar checkout and stores order metadata: `orderId`, `orderType`, `userId`, `analysisId`, `amount`.
3. After a successful checkout, `/payment/success?provider=polar&checkout_id=...` confirms the checkout and saves a `COMPLETED` purchase.
4. The customer returns to `/analyze?id=...` with the premium report unlocked and can see the order in `/mypage`.

Refund:

1. Customer opens `/mypage` > `의뢰 및 주문 내역` and presses `환불 요청`.
2. The app saves a separate refund request row with `order_type=refund`, `status=REQUESTED`, and `payment_key=refund_request_{originalOrderId}`.
3. Operator opens `/admin`, copies the original order id, then opens Polar > Sales and runs `Refund Order`.
4. Polar sends `order.refunded` to `/api/polar-webhook`.
5. The original purchase and the refund request row become `REFUNDED`; the customer timeline shows payment, request, and completion.

## Security note

MUMULAB's old Polar implementation exposed an access token in client-side HTML. Rotate that token in Polar and use this server-side pattern for 41pungsoo.
