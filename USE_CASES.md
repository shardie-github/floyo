# Floyo Use Cases

Real-world scenarios where Floyo helps people discover and automate their workflow patterns.

---

## Use Case 1: The Data Analyst's Daily Report

### The Problem

Sarah is a data analyst who runs a Python script every morning to process sales data from a CSV file. After the script completes, she:
1. Opens the output file
2. Copies key metrics
3. Pastes them into an email template
4. Sends the email to her team
5. Saves the output file to a shared Dropbox folder

This process takes 10-15 minutes every day, and she sometimes forgets steps or makes copy-paste errors.

### How Floyo Solves It

Floyo detects this pattern:
- Python script execution (`process_sales.py`)
- Output file creation (`sales_report.json`)
- Email client usage
- Dropbox folder access

**Suggestion:** "You always run `process_sales.py` and then manually email and upload the results. Here's code to automate both steps:"

```python
# Add to your script
import smtplib
from email.mime.text import MIMEText
import dropbox

def send_and_upload_report(report_file):
    # Send email
    msg = MIMEText(f"Daily sales report attached.")
    msg['Subject'] = 'Daily Sales Report'
    msg['To'] = 'team@company.com'
    # ... email sending code ...
    
    # Upload to Dropbox
    dbx = dropbox.Dropbox('YOUR_TOKEN')
    with open(report_file, 'rb') as f:
        dbx.files_upload(f.read(), '/reports/' + report_file)
```

### The Outcome

- **Time Saved:** 10-15 minutes per day = 40+ hours per year
- **Error Reduction:** Eliminates copy-paste mistakes
- **Reliability:** Reports are always sent, even when Sarah is busy
- **Focus:** Sarah can focus on analysis instead of file management

---

## Use Case 2: The Developer's Deployment Workflow

### The Problem

Mike is a full-stack developer who follows this workflow multiple times per day:
1. Edits TypeScript files in his editor
2. Runs tests locally
3. Commits and pushes to GitHub
4. Checks GitHub Actions for build status
5. Monitors Vercel deployment logs
6. Tests the deployed site

He constantly switches between his editor, terminal, browser tabs, and monitoring dashboards. This context switching slows him down and makes it easy to miss issues.

### How Floyo Solves It

Floyo detects this pattern:
- TypeScript file edits
- Test command executions (`npm test`)
- Git commands (`git push`)
- Browser activity on GitHub/Vercel

**Suggestion:** "You frequently check deployment status after pushing code. Here's a script that monitors deployments and notifies you:"

```bash
#!/bin/bash
# Add to your workflow
git push && \
  echo "Waiting for deployment..." && \
  # Monitor Vercel deployment
  # Send Slack notification when complete
```

Or a more sophisticated integration:

```python
# GitHub webhook → Vercel API → Slack notification
# Automatically notify when deployment completes
```

### The Outcome

- **Context Switching Reduced:** Fewer tab switches and mental overhead
- **Faster Feedback:** Get notified when deployments complete instead of polling
- **Issue Detection:** Catch deployment failures immediately
- **Flow State:** Stay in your editor longer without interruption

---

## Use Case 3: The Content Creator's Publishing Pipeline

### The Problem

Emma creates content in markdown, then:
1. Converts markdown to PDF using Pandoc
2. Uploads PDF to Google Drive
3. Creates a blog post from the markdown
4. Publishes to WordPress
5. Shares the link on Twitter

This multi-step process is repetitive and time-consuming. She sometimes forgets steps or uploads the wrong version.

### How Floyo Solves It

Floyo detects this pattern:
- Markdown file creation/editing
- Pandoc command execution
- Google Drive uploads
- WordPress admin access
- Twitter activity

**Suggestion:** "You always convert markdown to PDF and publish to multiple platforms. Here's a workflow automation:"

```python
# publish_content.py
import subprocess
from pathlib import Path
import requests

def publish_content(md_file):
    # Convert to PDF
    subprocess.run(['pandoc', md_file, '-o', 'output.pdf'])
    
    # Upload to Google Drive (using API)
    # ... upload code ...
    
    # Publish to WordPress (using API)
    # ... publish code ...
    
    # Post to Twitter (using API)
    # ... tweet code ...
    
    print("Content published to all platforms!")
```

### The Outcome

- **Time Saved:** 20+ minutes per article = hours per week
- **Consistency:** Same process every time, no forgotten steps
- **Version Control:** Always uploads the correct version
- **Scale:** Can publish more content with the same time investment

---

## Use Case 4: The Researcher's Data Pipeline

### The Problem

David is a researcher who:
1. Downloads data files from various sources
2. Runs Python analysis scripts
3. Generates visualizations
4. Saves results to a shared folder
5. Sends summary emails to collaborators
6. Updates a shared spreadsheet with key findings

This workflow involves many manual steps and file movements. He sometimes loses track of which files are where.

### How Floyo Solves It

Floyo detects this pattern:
- Data file downloads (CSV, JSON files)
- Python script executions
- Visualization generation (matplotlib/seaborn)
- Email sending
- Spreadsheet updates

**Suggestion:** "You process data files and share results via email and spreadsheet. Here's an automated pipeline:"

```python
# research_pipeline.py
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

def process_research_data(input_file):
    # Load and analyze
    df = pd.read_csv(input_file)
    results = analyze(df)
    
    # Generate visualization
    plt.figure(figsize=(10, 6))
    # ... plotting code ...
    plt.savefig('results.png')
    
    # Save to shared folder
    # ... file copy code ...
    
    # Send email with results
    # ... email code ...
    
    # Update shared spreadsheet (using Google Sheets API)
    # ... spreadsheet update code ...
```

### The Outcome

- **Reproducibility:** Same process every time, easier to reproduce results
- **Collaboration:** Team gets updates automatically
- **Organization:** Files are always in the right place
- **Focus:** More time for analysis, less time on file management

---

## Use Case 5: The Freelancer's Client Reporting

### The Problem

Alex is a freelancer who tracks time using a local tool, then:
1. Exports time entries to CSV
2. Opens the CSV in Excel
3. Formats it for the client
4. Saves as PDF
5. Emails it to the client
6. Updates a project management tool

This process repeats weekly for multiple clients, taking significant time.

### How Floyo Solves It

Floyo detects this pattern:
- Time tracking tool usage
- CSV file creation
- Excel usage
- PDF generation
- Email sending
- Project management tool access

**Suggestion:** "You generate weekly reports from time tracking data. Here's an automation:"

```python
# weekly_report.py
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def generate_client_report(client_name):
    # Export from time tracker (using API or file read)
    time_data = export_time_entries(client_name)
    
    # Format and create PDF
    # ... PDF generation code ...
    
    # Email to client
    # ... email code ...
    
    # Update project management tool (using API)
    # ... update code ...
    
    print(f"Report sent to {client_name}")
```

### The Outcome

- **Time Saved:** 30+ minutes per client per week
- **Professionalism:** Consistent, well-formatted reports
- **Scalability:** Can handle more clients with the same time
- **Accuracy:** No manual data entry errors

---

## Use Case 6: The Marketer's Campaign Analysis

### The Problem

Jordan runs marketing campaigns and needs to:
1. Download campaign data from multiple platforms (Google Ads, Facebook Ads, etc.)
2. Combine data in a spreadsheet
3. Calculate key metrics
4. Create visualizations
5. Write a summary report
6. Share with the team via Slack

This process is manual, time-consuming, and prone to errors when combining data from different sources.

### How Floyo Solves It

Floyo detects this pattern:
- Multiple ad platform logins
- CSV/Excel file downloads
- Data manipulation in spreadsheets
- Report writing
- Slack usage

**Suggestion:** "You aggregate data from multiple ad platforms. Here's an automated aggregation script:"

```python
# campaign_aggregator.py
import pandas as pd
from google_ads_api import GoogleAds
from facebook_ads_api import FacebookAds

def aggregate_campaign_data(start_date, end_date):
    # Fetch from Google Ads
    google_data = GoogleAds.get_campaign_data(start_date, end_date)
    
    # Fetch from Facebook Ads
    facebook_data = FacebookAds.get_campaign_data(start_date, end_date)
    
    # Combine and analyze
    combined = pd.concat([google_data, facebook_data])
    metrics = calculate_metrics(combined)
    
    # Generate visualization
    create_dashboard(metrics)
    
    # Post summary to Slack
    post_to_slack(format_summary(metrics))
```

### The Outcome

- **Time Saved:** Hours per week on manual data aggregation
- **Accuracy:** No copy-paste errors when combining data
- **Timeliness:** Reports are ready faster
- **Insights:** More time for analysis, less time on data collection

---

## Use Case 7: The Student's Research Workflow

### The Problem

Sam is a graduate student who:
1. Reads PDFs and takes notes in markdown
2. Saves references to a citation manager
3. Writes papers in LaTeX
4. Compiles LaTeX to PDF
5. Uploads to a cloud storage for backup
6. Shares drafts with advisors via email

Managing all these tools and files is overwhelming, and it's easy to lose track of sources or forget to backup work.

### How Floyo Solves It

Floyo detects this pattern:
- PDF reader usage
- Markdown file creation
- Citation manager access
- LaTeX compilation
- Cloud storage uploads
- Email sending

**Suggestion:** "You manage research files across multiple tools. Here's a workflow automation:"

```python
# research_workflow.py
from pathlib import Path
import subprocess

def process_research_file(pdf_path):
    # Extract notes (using PDF parsing)
    notes = extract_notes(pdf_path)
    
    # Save to markdown
    save_notes_markdown(notes)
    
    # Add to citation manager (using API)
    add_to_citations(pdf_path)
    
    # Auto-backup to cloud storage
    backup_to_cloud(pdf_path)
```

### The Outcome

- **Organization:** Files are always backed up and organized
- **Time Saved:** Less manual file management
- **Peace of Mind:** Automatic backups prevent data loss
- **Focus:** More time on research, less on file management

---

## Use Case 8: The Small Business Owner's Bookkeeping

### The Problem

Taylor runs a small business and needs to:
1. Download bank statements
2. Categorize transactions in accounting software
3. Generate financial reports
4. Export reports to PDF
5. Email reports to accountant
6. Update a spreadsheet with key numbers

This monthly process is tedious and time-consuming, taking away from running the business.

### How Floyo Solves It

Floyo detects this pattern:
- Bank website access
- Accounting software usage
- PDF generation
- Email sending
- Spreadsheet updates

**Suggestion:** "You process financial data monthly. Here's an automation:"

```python
# monthly_bookkeeping.py
from bank_api import download_statements
from accounting_api import categorize_transactions, generate_reports

def monthly_bookkeeping():
    # Download bank statements
    statements = download_statements(month='last')
    
    # Categorize transactions
    categorized = categorize_transactions(statements)
    
    # Generate reports
    reports = generate_reports(categorized)
    
    # Email to accountant
    email_reports(reports)
    
    # Update spreadsheet
    update_summary_sheet(reports)
```

### The Outcome

- **Time Saved:** Hours per month on manual bookkeeping
- **Accuracy:** Fewer manual entry errors
- **Timeliness:** Reports are ready on time, every time
- **Business Focus:** More time for actual business operations

---

## Use Case 9: The Designer's Asset Management

### The Problem

Morgan is a designer who:
1. Creates designs in Figma
2. Exports assets in multiple formats
3. Optimizes images
4. Uploads to a CDN
5. Updates a design system documentation
6. Notifies the team via Slack

This process repeats for every design iteration, creating a lot of manual work.

### How Floyo Solves It

Floyo detects this pattern:
- Figma usage
- Image file exports
- Image optimization tools
- CDN uploads
- Documentation updates
- Slack notifications

**Suggestion:** "You export and optimize design assets regularly. Here's an automation:"

```python
# design_asset_pipeline.py
from figma_api import export_assets
from image_optimizer import optimize_images
from cdn_api import upload_to_cdn

def process_design_assets(figma_file_id):
    # Export from Figma
    assets = export_assets(figma_file_id, formats=['png', 'svg', 'jpg'])
    
    # Optimize images
    optimized = optimize_images(assets)
    
    # Upload to CDN
    urls = upload_to_cdn(optimized)
    
    # Update design system docs
    update_design_system(urls)
    
    # Notify team
    notify_slack(f"New assets available: {urls}")
```

### The Outcome

- **Time Saved:** Significant time on repetitive export/upload tasks
- **Consistency:** Same optimization and upload process every time
- **Team Communication:** Team is automatically notified of new assets
- **Focus:** More time designing, less time on asset management

---

## Use Case 10: The Consultant's Proposal Generation

### The Problem

Casey is a consultant who:
1. Reviews client requirements documents
2. Creates proposal templates
3. Customizes proposals with client-specific information
4. Generates PDFs
5. Emails proposals to clients
6. Tracks proposal status in a CRM

This process is repetitive and time-consuming, especially when similar proposals are needed for multiple clients.

### How Floyo Solves It

Floyo detects this pattern:
- Document reading (requirements files)
- Template file usage
- PDF generation
- Email sending
- CRM access

**Suggestion:** "You generate proposals from templates regularly. Here's an automation:"

```python
# proposal_generator.py
from docx import Document
from crm_api import get_client_info

def generate_proposal(client_id, template_path):
    # Get client info from CRM
    client = get_client_info(client_id)
    
    # Load template
    doc = Document(template_path)
    
    # Customize with client info
    customize_proposal(doc, client)
    
    # Generate PDF
    pdf_path = convert_to_pdf(doc)
    
    # Email to client
    email_proposal(client['email'], pdf_path)
    
    # Update CRM
    update_crm_proposal_status(client_id, 'sent')
```

### The Outcome

- **Time Saved:** Hours per proposal on manual customization
- **Consistency:** Proposals follow the same format
- **Accuracy:** No copy-paste errors with client information
- **Scale:** Can handle more proposals with the same time

---

## Common Themes

Across all these use cases, Floyo helps by:

1. **Detecting Repetitive Patterns:** Identifying workflows that happen regularly
2. **Providing Concrete Solutions:** Not just suggestions, but actual code you can use
3. **Saving Time:** Eliminating manual steps that add up over time
4. **Reducing Errors:** Automating steps that are prone to mistakes
5. **Improving Focus:** Letting you focus on high-value work instead of file management

**The bottom line:** Floyo doesn't just tell you automation is possible—it shows you exactly how to automate *your* specific workflow.
