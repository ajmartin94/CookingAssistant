# Cooking Assistant - Tester Guide

Welcome! Thank you for helping test Cooking Assistant. This guide will get you started.

---

## What Is This App?

Cooking Assistant is an **AI-powered recipe manager**. You can:

- **Save recipes** - Store your favorite recipes with ingredients and instructions
- **Organize into libraries** - Group recipes by cuisine, meal type, or any category you like
- **Chat with AI** - Ask the AI assistant to help you modify recipes, suggest substitutions, or answer cooking questions

This is **alpha software** — we're still building it! Your feedback helps us make it better.

---

## Getting Started

### 1. Access the App

You'll receive a URL from the person hosting the test (something like `https://random-words.trycloudflare.com`). Open it in your browser.

**Supported browsers:** Chrome, Firefox, Safari, Edge (latest versions)

### 2. Create an Account

1. Click **Register** on the login page
2. Enter a username, email, and password
3. Click **Sign Up**

That's it! You're now logged in.

### 3. Explore the Interface

| Area | What It Does |
|------|--------------|
| **Recipes** | View, create, edit, and delete recipes |
| **Libraries** | Organize recipes into collections |
| **Chat Panel** | Ask the AI for help (look for the chat icon) |

---

## Using the AI Chat

The chat panel is your AI cooking assistant. Here's how to use it:

### Opening the Chat

Look for a **chat icon** (usually in the corner of the screen). Click it to open the chat panel.

### What You Can Ask

- "What can I substitute for eggs in this recipe?"
- "How do I make this recipe gluten-free?"
- "Suggest a side dish to go with this"
- "Convert this recipe to metric measurements"

### How AI Responses Work

1. **You type a message** and press Enter
2. **The AI thinks** (you'll see a loading indicator)
3. **Response streams in** word by word

### Tool Confirmation (AI Assist Mode)

Sometimes the AI will suggest making a change to a recipe. When this happens:

1. You'll see an **Approve / Reject** prompt
2. **Approve** → The change is made
3. **Reject** → The change is cancelled

This keeps you in control — the AI won't change anything without your permission.

---

## Known Limitations

This is early software. Here's what to expect:

| Feature | Status |
|---------|--------|
| Recipe CRUD (create, read, update, delete) | ✅ Working |
| Libraries | ✅ Working |
| AI Chat | ✅ Working (may be slow) |
| Meal Planning | ❌ Not yet built |
| Grocery Lists | ❌ Not yet built |
| Mobile App | ❌ Not yet built |

### Things That Might Happen

- **Slow AI responses** — The AI runs locally and may take 10-30 seconds to respond, depending on the host's hardware
- **Occasional errors** — If something breaks, try refreshing the page
- **Missing features** — Many planned features aren't built yet
- **Data may be reset** — During testing, we may need to clear the database

---

## Giving Feedback

Your feedback is incredibly valuable! Here's how to share it:

### What We Want to Know

- **Bugs** — Something broke or didn't work as expected
- **Confusion** — The app was unclear or hard to use
- **Ideas** — Features you wish existed
- **Praise** — Things you liked (we want to keep those!)

### How to Report

**Option 1: In-App Feedback**
- After AI responses, use the 👍 / 👎 buttons to rate the answer

**Option 2: Direct Feedback**
- Send a message to the person who invited you to test
- Include: what you were trying to do, what happened, what you expected

**Option 3: GitHub Issues** (if you have a GitHub account)
- Open an issue at: https://github.com/ajmartin94/CookingAssistant/issues
- Use the "Bug Report" or "Feature Request" template

### Good Bug Reports Include

1. **What you were doing** — "I was editing a recipe"
2. **What happened** — "The save button didn't work"
3. **What you expected** — "The recipe should have saved"
4. **Browser & device** — "Chrome on Windows laptop"

---

## Accessing via Cloudflare Tunnel

If you're the **host** setting up access for testers, here's how:

### Setup (One-Time)

1. Install cloudflared:
   ```bash
   # macOS
   brew install cloudflared

   # Windows (download from cloudflare.com/products/tunnel)
   # Linux
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   ```

2. Start the app:
   ```bash
   docker compose up -d
   ```

3. Create the tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. Share the URL with testers (looks like `https://random-words.trycloudflare.com`)

### Important Notes

- The URL changes each time you restart the tunnel
- Testers need internet access but don't need any special software
- The tunnel is secure (HTTPS)
- When you stop cloudflared, testers lose access

---

## Troubleshooting

### "Page won't load"

- **Check the URL** — Make sure you're using the correct link from the host
- **Try refreshing** — Sometimes the first load is slow
- **Check your internet** — The app requires an internet connection

### "Can't log in"

- **Check your credentials** — Username/password are case-sensitive
- **Try registering again** — If testing started fresh, your account may have been reset

### "AI isn't responding"

- **Wait longer** — AI responses can take 30+ seconds on slower hardware
- **Refresh and try again** — The AI service may have restarted
- **Ask the host** — They can check if Ollama is running

### "Something looks broken"

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Try a different browser**
3. **Clear your browser cache** (Settings → Clear browsing data)
4. **Report it** — See the feedback section above

### "I lost my recipes"

During alpha testing, data may be reset. We'll warn you before this happens when possible.

---

## Quick Reference

| Task | How To |
|------|--------|
| Create a recipe | Recipes → New Recipe → Fill in details → Save |
| Edit a recipe | Click on recipe → Edit → Make changes → Save |
| Delete a recipe | Click on recipe → Delete → Confirm |
| Ask AI a question | Open chat panel → Type message → Enter |
| Approve AI action | Click "Approve" on the confirmation prompt |
| Rate AI response | Use 👍 or 👎 buttons after a response |
| Log out | Click your username → Log Out |

---

## Thank You!

You're helping build something useful. Every bug you find, every confusing moment you report, and every idea you share makes Cooking Assistant better.

Happy cooking! 🍳
