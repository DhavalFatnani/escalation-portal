# Uptime Monitoring Setup Guide

## Purpose

Prevent Render.com's free tier from spinning down your app after 15 minutes of inactivity. By pinging your health endpoint every 10 minutes, you can keep your app warm 24/7 and eliminate cold starts.

---

## Option 1: UptimeRobot (Recommended)

**Free Tier Benefits:**
- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ Email/SMS alerts
- ✅ Public status pages
- ✅ No credit card required

### Setup Steps

#### 1. Create Account
- Go to https://uptimerobot.com/
- Click "Register for FREE"
- Sign up with your email
- Verify your email address

#### 2. Add Monitor
1. Click "+ Add New Monitor"
2. Fill in the details:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Escalation Portal - Health Check
   - **URL:** `https://your-app-name.onrender.com/api/health`
     - Replace `your-app-name` with your actual Render service name
   - **Monitoring Interval:** 10 minutes (600 seconds)
     - Note: Free tier minimum is 5 minutes, but 10 minutes is sufficient
   - **Monitor Timeout:** 30 seconds
   - **HTTP Method:** GET (default)

3. **Alert Contacts (Optional):**
   - Add your email to get notified if the app goes down
   - Configure alert thresholds (e.g., alert when down for 2+ minutes)

4. Click "Create Monitor"

#### 3. Verify Setup
- Wait 10 minutes for the first ping
- Check the monitor dashboard - it should show "Up" with a green status
- Visit your app - there should be no cold start delay!

#### 4. Check Logs (Optional)
- Go to your Render dashboard
- Check logs for repeated `GET /api/health` requests every 10 minutes

---

## Option 2: Cron-Job.org (Alternative)

**Free Tier Benefits:**
- ✅ Unlimited cron jobs
- ✅ 1-minute minimum interval
- ✅ Execution history
- ✅ Email notifications

### Setup Steps

#### 1. Create Account
- Go to https://cron-job.org/
- Sign up for a free account
- Verify your email

#### 2. Create Cron Job
1. Click "Cronjobs" → "Create cronjob"
2. Fill in:
   - **Title:** Escalation Portal Health Check
   - **Address:** `https://your-app-name.onrender.com/api/health`
   - **Schedule:** Every 10 minutes
     - Select "Every X minutes" and enter "10"
   - **Request method:** GET
   - **Timeout:** 30 seconds

3. **Notifications (Optional):**
   - Enable "Notify on execution failures"
   - Set email address

4. Click "Create cronjob"

#### 3. Verify
- Check execution history after 10 minutes
- Status should be "Success" with HTTP 200 response

---

## Option 3: Koyeb (Alternative)

**Free Tier Benefits:**
- ✅ 2 web services
- ✅ No sleep/cold starts
- ✅ Better than Render for always-on apps

If you find Render's cold starts still annoying even with monitoring, consider migrating to Koyeb's free tier which doesn't spin down.

---

## Verification Checklist

After setting up monitoring, verify it's working:

- [ ] Monitor shows "Up" status
- [ ] No cold start delay when accessing the app
- [ ] Render logs show regular `/api/health` requests every 10 minutes
- [ ] App responds instantly at any time of day
- [ ] Email alerts configured for downtime (optional)

---

## Cost Savings

**Without Monitoring:**
- First request after 15+ min: 30-60 second cold start
- Users frustrated with slow initial load
- Poor user experience

**With Monitoring:**
- ✅ Instant response 24/7
- ✅ Professional experience
- ✅ **Still 100% free** (using free monitoring services)
- ✅ Extends free tier usability indefinitely

---

## Troubleshooting

### Monitor Shows "Down"
- Check if your Render app is deployed and running
- Verify the URL is correct (include `/api/health`)
- Check Render logs for errors
- Ensure health endpoint returns HTTP 200

### Still Getting Cold Starts
- Reduce monitoring interval to 5 minutes (UptimeRobot minimum)
- Verify monitor is actually running (check execution history)
- Check if Render has any service interruptions

### Too Many Requests in Logs
- 10-minute intervals = 144 requests/day
- This is minimal and well within Render's free tier limits
- Don't reduce interval further unless necessary

---

## Advanced: Multiple Monitors

For production reliability, set up monitors on multiple services:

1. **UptimeRobot:** Primary health checks (every 10 min)
2. **Cron-Job.org:** Backup health checks (every 15 min)
3. **Pingdom (Free tier):** Status page monitoring

This provides redundancy if one monitoring service goes down.

---

## Next Steps

After setting up uptime monitoring:
1. ✅ Verify no more cold starts
2. Implement image compression (next priority)
3. Add pagination to reduce bandwidth
4. Monitor Supabase usage weekly

Your app should now stay warm 24/7 on Render's free tier! 🚀

