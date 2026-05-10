# YTA Tools — YouTube AI Automation

Isang full-featured YouTube content automation tool na may AI generators,
real analytics, at automatic video posting.

---

## Files sa Project

```
yta-netlify/
├── index.html                    ← Main app (lahat ng tools)
├── analytics.html                ← YT Analytics page
├── netlify.toml                  ← Netlify config
├── .env.example                  ← Template ng environment variables
└── netlify/functions/
    ├── generate.js               ← AI text generator (Anthropic)
    ├── yt-auth.js                ← YouTube OAuth login URL
    ├── yt-callback.js            ← OAuth callback handler
    ├── yt-data.js                ← YouTube channel + analytics data
    └── yt-upload.js              ← YouTube video upload
```

---

## Step-by-Step: I-deploy sa Netlify

### STEP 1 — I-upload ang files sa GitHub

1. Pumunta sa https://github.com → New repository
2. Pangalanan: `yta-tools`
3. I-upload ang lahat ng files (i-drag ang folder)
4. I-click "Commit changes"

---

### STEP 2 — I-connect sa Netlify

1. Pumunta sa https://netlify.com → Log in
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → piliin ang `yta-tools` repo
4. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `.`
5. Click **"Deploy site"**

---

### STEP 3 — Kumuha ng Anthropic API Key

1. Pumunta sa https://console.anthropic.com/api-keys
2. Mag-sign up (libre ang paglagay ng card, may free credits)
3. Click **"Create Key"** → i-copy ang key (`sk-ant-...`)

---

### STEP 4 — I-setup ang Google OAuth (para sa YouTube)

1. Pumunta sa https://console.cloud.google.com
2. Click **"New Project"** → pangalanan: `YTA Tools`
3. Pumunta sa **APIs & Services** → **Library**
4. I-enable ang dalawang ito:
   - ✅ **YouTube Data API v3**
   - ✅ **YouTube Analytics API**
5. Pumunta sa **APIs & Services** → **Credentials**
6. Click **"+ Create Credentials"** → **OAuth client ID**
7. Application type: **Web application**
8. Name: `YTA Tools`
9. Sa **Authorized redirect URIs**, i-add:
   ```
   https://YOUR-SITE-NAME.netlify.app/auth/callback
   ```
   *(palitan ng actual na Netlify URL mo)*
10. Click **"Create"** → i-copy ang **Client ID** at **Client Secret**

---

### STEP 5 — I-add ang Environment Variables sa Netlify

1. Sa Netlify dashboard → piliin ang site mo
2. Pumunta sa **Site configuration** → **Environment variables**
3. I-add ang mga ito:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (mula Step 3) |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` (mula Step 4) |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` (mula Step 4) |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-SITE.netlify.app/auth/callback` |

4. Click **"Save"**
5. Pumunta sa **Deploys** → **"Trigger deploy"** → **"Deploy site"**

---

### STEP 6 — Test!

1. Buksan ang `https://YOUR-SITE.netlify.app`
2. I-try ang kahit anong AI generator (kailangan ng Anthropic key)
3. I-click ang **"Connect YouTube"** para i-test ang OAuth
4. Buksan ang `https://YOUR-SITE.netlify.app/analytics.html` para sa analytics

---

## Features ng App

| Tool | Description |
|---|---|
| 🔍 Niche Finder | Profitable niche analysis + 10 video ideas |
| 🎬 Scenario + Hook | 3-6 second hook + full script |
| 😊 Character Gen | 5 art styles + AI image preview |
| 🎥 Prompt to Video | AI video prompts para sa Runway, Pika, Kling |
| 🎙️ My Voice to AI | Voice style guide + AI prompt template |
| ✏️ Title & Description | 5 titles + SEO description + hashtags |
| 🖼️ Thumbnail | Concept + AI preview (Pollinations.ai) |
| 🛡️ Copyright Check | Copyright + fact check bago mag-upload |
| 📊 Analytics | Real YT analytics per video (separate page) |
| 📤 Auto-Post | Upload long video + shorts sa YouTube |

---

## Troubleshooting

**"Function not found" error**
→ I-check kung nasa tamang folder ang functions: `netlify/functions/`

**"ANTHROPIC_API_KEY not set"**
→ I-add ang key sa Netlify environment variables at i-redeploy

**YouTube OAuth redirect error**
→ I-check kung exact ang redirect URI sa Google Console at sa Netlify env var

**Analytics walang data**
→ Siguraduhing naka-enable ang YouTube Analytics API sa Google Console

---

## Image Generation

Gumagamit ng **Pollinations.ai** para sa character at thumbnail previews — libre, walang API key. Para sa mas mataas na kalidad, gamitin ang generated prompts sa:
- Midjourney (midjourney.com)
- DALL-E (platform.openai.com)
- Adobe Firefly (firefly.adobe.com)

---

*YTA Tools — Built for Filipino YouTubers 🇵🇭*
