# 🚀 LifeLine — Run & Deploy Guide (100% Free)

This project is a **fully working** LifeLine MVP: Next.js + TypeScript,
with a real matching engine, hospital dashboard, donor list, and bank
inventory view. It uses in-memory seed data, so it works instantly with
**zero setup** — no database account needed to demo it.

---

## 1. Run it on your laptop

```bash
# Unzip the folder, then inside it:
npm install
npm run dev
```

Open **http://localhost:3000** — try the Hospital dashboard, raise a
request (e.g. blood group O+, urgency Critical), and watch the ranked
matches appear.

Requirements: Node.js 18+ installed. Download free from https://nodejs.org

---

## 2. Push to GitHub (free)

```bash
git init
git add .
git commit -m "LifeLine MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/lifeline.git
git push -u origin main
```

(Create the empty repo first on github.com — no paid plan needed.)

---

## 3. Deploy to Vercel (free, ~2 minutes)

1. Go to https://vercel.com → sign up with your GitHub account (free)
2. Click **"Add New Project"** → select your `lifeline` repo
3. Leave all settings default (Vercel auto-detects Next.js)
4. Click **Deploy**

That's it — you'll get a live URL like `lifeline-yourname.vercel.app`
that you can put in your hackathon submission.

---

## 4. What's real vs. what's simulated (be honest with judges)

✅ **Fully real and working:**
- The matching engine (ABO/Rh compatibility filter + weighted scoring)
- The scoring formula exactly as designed: `0.35×Urgency + 0.30×Proximity + 0.20×Expiry + 0.15×Reliability`
- Distance calculation (real Haversine formula between coordinates)
- End-to-end flow: raise request → get ranked matches → confirm/lock

⚠️ **Simulated for the demo (documented, not hidden):**
- Data is in-memory (resets when the server restarts) instead of a
  persistent database
- Hospital location is picked from a preset list instead of live GPS
- Notifications (SMS/email) are not wired up yet — the UI shows what
  *would* happen (lock confirmation message)

This is completely normal for a hackathon MVP — judges care that the
**core logic is real and correct**, which it is.

---

## 5. Next steps to make it production-grade (if you have more time)

### Add persistent database (Supabase — free tier)
1. Create a project at https://supabase.com (free, no card required)
2. Create tables matching `lib/types.ts` (donors, bank_units, requests)
3. Replace `lib/store.ts` functions with Supabase client calls —
   `matchingEngine.ts` doesn't need to change at all, since it just
   takes arrays of donors/bankUnits as input

### Add real authentication
- Supabase Auth (free) — email/password or phone OTP for donor sign-up

### Add real notifications
- Resend (free tier, 3000 emails/month) for email
- Twilio (free trial credits) for SMS

None of these are required to demo and submit — they're for after,
if you want to keep building this beyond the hackathon.

---

## 6. If something breaks

- **"npm not found"** → install Node.js from nodejs.org first
- **Build fails on Vercel** → check the deployment logs tab, usually a
  typo; paste the error into Claude chat and it can be fixed fast
- **Page shows blank/error** → open browser console (F12) and check
  for red errors, share them for a quick fix

---

<p align="center"><b>One mission. Build the impossible. 🩸</b></p>
