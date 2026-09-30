# Remotion Lambda setup (AWS) — one time, ~30 min

Renders a 60 s video in minutes by splitting it across many AWS Lambda functions. Cost ≈ cents to ~$1 per render.
Remotion is free for individuals / companies of ≤ 3 people.

## A. AWS account (in the browser)
1. Create an account at aws.amazon.com (card required for verification).
2. Top-right region selector → **Asia Pacific (Mumbai) ap-south-1** (closest to you). Use this region everywhere.
3. **Billing → Budgets → Create budget** → Monthly cost budget **$5** with an email alert at 80%. (Safety net.)

## B. Install the Lambda package (on the Mac, in the engine folder)
```bash
cd ~/Movies/motion-engine
npm i @remotion/lambda@4.0.290        # must match remotion 4.0.290
```

## C. Permissions (AWS console → IAM)
4. **Policy**: IAM → Policies → Create policy → JSON tab. In Terminal run `npx remotion lambda policies role`, paste the output. Name it exactly **`remotion-lambda-policy`**.
5. **Role**: IAM → Roles → Create role → trusted entity **AWS service → Lambda** → attach `remotion-lambda-policy` → name exactly **`remotion-lambda-role`**.
6. **User**: IAM → Users → Create user `remotion-user` (no console access).
7. **User permissions**: open the user → Add permissions → **Create inline policy** → JSON → paste the output of `npx remotion lambda policies user` → name `remotion-user-policy`.
8. **Access key**: user → Security credentials → Create access key → "Application running on an AWS compute service" → copy both values.

## D. Keys (never paste these into any chat)
9. Create `~/Movies/motion-engine/.env`:
```
REMOTION_AWS_ACCESS_KEY_ID=...
REMOTION_AWS_SECRET_ACCESS_KEY=...
REMOTION_AWS_REGION=ap-south-1
```

## E. Deploy + test
```bash
npx remotion lambda policies validate                     # all green = permissions OK
npx remotion lambda quotas                                # new accounts often start at 10 concurrent — request 1000 via Service Quotas → Lambda → Concurrent executions (free)
npx remotion lambda functions deploy --memory=3008 --timeout=240
npx remotion lambda sites create src/index.ts --site-name=motion-engine    # prints a serve URL
npx remotion lambda render <serve-url> WebEpexV2-60s out/webepex_v2_lambda.mp4
```
The render prints time and cost. Re-run `sites create` after any code change (same site name overwrites).

## Notes
- 3D renders on Lambda with software GL (swangle): slower per frame, but hundreds of workers make the total fast.
- Big assets (music, screenshots) are uploaded with the site; keep `public/` lean.
- To stop all costs: delete the function (`npx remotion lambda functions rmall`) and the site bucket (`npx remotion lambda sites rmall`).
