# 41Pungsoo AI customer and operator runbook

## Customer journey

1. Visit `https://41pungsoo-ai.vercel.app/`.
2. Press the main analysis CTA and move to `/analyze`.
3. Log in with Google or Kakao. The app redirects back to the page the customer was on.
4. Enter the space information and run the free feng shui analysis.
5. Review the free summary, score, direction notes, and preview of the locked premium report.
6. Press the premium unlock button and move to the Polar checkout.
7. Complete payment. The success page confirms Polar and returns the customer to `/analyze?id={analysisId}`.
8. The premium report, remedy content, and paid sections are unlocked for that analysis.
9. Open `/mypage` to see analysis history, orders, refund status, and generated collections.
10. Press `로그아웃` from the profile card when finished.

## Refund journey

1. Customer opens `/mypage` > `의뢰 및 주문 내역`.
2. For a completed order, press `환불 요청`.
3. Enter a concrete refund reason. Empty reasons are blocked.
4. The order card immediately refreshes and shows a timeline:
   - payment completed
   - refund requested
   - operator reviewing
5. After the operator processes the refund in Polar, the timeline changes to `환불 완료`.

## Operator journey

1. Log in as `lrinvl1203@gmail.com`.
2. Open `https://41pungsoo-ai.vercel.app/admin`.
3. Check top stats, conversion funnel, refund requests, recent orders, and recent events.
4. For refunds, copy the original order id shown in the refund request card.
5. Open Polar Dashboard > `mumulab` > Sales.
6. Find the order by id or customer email.
7. Open the order detail and press `Refund Order`.
8. After the refund, return to `/admin` and press `새로고침`.
9. Confirm the original purchase and refund request are both `REFUNDED`.
10. As the customer, open `/mypage` and confirm the refund timeline shows completion.

## Guardrails

- Only `lrinvl1203@gmail.com` can read `/admin` purchase and event data.
- Refunded orders cannot be reopened by revisiting an old Polar success URL.
- Already refunded orders cannot create a new refund request.
- The app requires `order.refunded` in the Polar webhook event list for automatic refund completion.
- Real money actions must be done in Polar by the operator, not automatically from the public customer screen.
