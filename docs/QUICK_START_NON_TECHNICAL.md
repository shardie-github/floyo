# Floyo Quick Start Guide (Non-Technical)

## Welcome to Floyo! 🎉

Floyo is designed to make your life easier by automating repetitive tasks. This guide will get you started in 5 minutes.

---

## What is Floyo?

**Floyo watches how you work and automatically suggests ways to automate repetitive tasks.**

Think of it like having a smart assistant that:
- Observes your work patterns
- Learns what you do repeatedly
- Suggests automations to save you time
- Provides ready-to-use code

**Example:** If you notice you always:
1. Edit a Python script
2. Run it to process data
3. Upload results to Dropbox
4. Email the results

Floyo will learn this pattern and suggest: *"Want me to automate this? I'll do steps 2-4 automatically whenever you edit that script."*

---

## Getting Started (5 Minutes)

### Step 1: Install Floyo

**Option A: Using Docker (Easiest)**
```bash
# Download and start Floyo
docker-compose up -d
```

**Option B: Local Installation**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install
```

### Step 2: Start Floyo

**With Docker:**
```bash
docker-compose up
```

**Locally:**
```bash
# Terminal 1: Start backend
cd backend
uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 3: Access Floyo

Open your browser to:
- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs

### Step 4: Create Your Account

1. Click "Sign Up" on the homepage
2. Enter your email and password
3. Verify your email (check your inbox)
4. Log in to your dashboard

---

## Using Floyo

### How It Works

1. **Floyo Learns Automatically**
   - Just use your computer normally
   - Floyo tracks file usage patterns in the background
   - No configuration needed!

2. **Review Suggestions**
   - After a few days, check your dashboard
   - See ML-powered automation suggestions
   - Each suggestion shows:
     - What pattern was detected
     - Suggested automation
     - Confidence score (how likely it is to help)
     - Ready-to-use code

3. **Apply a Suggestion**
   - Click "Apply" on a suggestion you like
   - Floyo creates the workflow automatically
   - The workflow runs automatically when triggered

4. **Monitor Results**
   - View workflow execution history
   - See time saved
   - Optimize based on results

---

## Key Features

### 1. **Smart Suggestions**
Floyo analyzes your work patterns and suggests automations automatically. You don't need to know what to automate—Floyo tells you.

### 2. **ML-Powered Confidence**
Each suggestion has a confidence score showing how likely it is to help. Higher scores = better suggestions.

### 3. **Visual Workflow Builder**
Don't code? No problem! Use the drag-and-drop visual builder to create workflows.

### 4. **Ready-to-Use Code**
For developers, Floyo generates actual code you can use immediately.

### 5. **Privacy-First**
All pattern analysis happens on your machine. Your data never leaves your computer unless you choose to sync.

---

## Common Use Cases

### For Developers
- **Automate build pipelines** - When code changes, automatically build and test
- **Sync repositories** - Keep GitHub, GitLab, and local repos in sync
- **Process data** - Chain scripts, databases, and cloud storage automatically

### For Marketers
- **Export reports** - Automatically generate and send weekly reports
- **Distribute content** - Publish to multiple platforms automatically
- **Process leads** - Route leads from forms to CRM automatically

### For Data Analysts
- **ETL pipelines** - Automate data extraction, transformation, loading
- **Generate reports** - Schedule and distribute reports automatically
- **Update dashboards** - Refresh visualizations automatically

### For Business Operations
- **Invoice processing** - Automate invoice workflows
- **Document management** - Organize and route documents automatically
- **Customer onboarding** - Automate welcome sequences

---

## Tips for Best Results

### 1. **Give It Time**
Floyo needs a few days to learn your patterns. Use your computer normally, and Floyo will detect patterns automatically.

### 2. **Review Suggestions Regularly**
Check your dashboard weekly to see new suggestions. Apply the ones that make sense for your workflow.

### 3. **Start Small**
Begin with simple automations. As you get comfortable, apply more complex suggestions.

### 4. **Provide Feedback**
When you apply or dismiss suggestions, Floyo learns your preferences and improves over time.

### 5. **Use the Visual Builder**
If you're not technical, use the drag-and-drop workflow builder. It's intuitive and doesn't require coding.

---

## Privacy & Security

### Your Data is Private
- **Local Analysis:** Pattern detection happens on your machine
- **No Cloud Required:** Works completely offline
- **Your Choice:** Optional cloud sync if you want it

### Security Features
- **Two-Factor Authentication:** Protect your account
- **Encryption:** Sensitive data encrypted
- **Audit Logs:** Track all operations
- **GDPR Ready:** Export or delete your data anytime

---

## Getting Help

### Documentation
- **User Guide:** See `docs/USER_GUIDE.md` for detailed instructions
- **API Documentation:** Visit `/docs` when running Floyo
- **Video Tutorials:** Coming soon!

### Support
- **GitHub Issues:** Report bugs or request features
- **Support Guide:** See `SUPPORT.md` for help
- **Community:** Join discussions (coming soon)

---

## Next Steps

1. ✅ **Set up Floyo** (you just did this!)
2. 📖 **Read the User Guide** - `docs/USER_GUIDE.md`
3. 🎯 **Let Floyo learn** - Use your computer normally for a few days
4. 💡 **Review suggestions** - Check your dashboard weekly
5. 🚀 **Apply workflows** - Start automating!

---

**Welcome to Floyo! Start saving 10+ hours per week with intelligent automation.**

---

**Questions?** See [SUPPORT.md](../SUPPORT.md) or check the documentation in `/docs`.
