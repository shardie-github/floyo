> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Privacy Self-Audit Checklist

Use this checklist to verify your privacy settings and understand what data is being collected.

## Initial Setup

- [ ] Read and understood the privacy policy
- [ ] Completed consent wizard with explicit opt-in
- [ ] Set up multi-factor authentication
- [ ] Reviewed default data retention period (14 days)

## App Monitoring

- [ ] Reviewed list of monitored apps
- [ ] Confirmed each app's scope (metadata_only vs metadata_plus_usage)
- [ ] Disabled monitoring for any apps you don't want tracked
- [ ] Verified no sensitive apps are enabled

## Signal Collection

- [ ] Reviewed which telemetry signals are enabled
- [ ] Adjusted sampling rates for each signal
- [ ] Confirmed no signals collect passwords, keystrokes, or message content
- [ ] Verified window title redaction is working

## Data & Retention

- [ ] Set appropriate data retention period
- [ ] Understood when old data will be automatically deleted
- [ ] Reviewed transparency log to see what's been collected

## Security

- [ ] MFA is enabled and working
- [ ] Verified elevated session expires after 1 hour
- [ ] Confirmed no one else has access to your account

## Transparency

- [ ] Reviewed transparency log entries
- [ ] Verified all actions are logged correctly
- [ ] Checked that no unexpected data collection occurred

## Export & Delete

- [ ] Know how to export your data (under Export/Delete tab)
- [ ] Understand delete options (immediate vs scheduled)
- [ ] Tested export functionality to verify data format

## Kill Switch

- [ ] Know how to disable monitoring (Privacy HUD → Pause)
- [ ] Understand that kill-switch env variable disables all collection
- [ ] Verified monitoring stops when paused

## Questions to Ask Yourself

1. **Am I comfortable with the apps being monitored?**
   - If not, disable them in Apps & Scopes tab

2. **Is the data retention period appropriate?**
   - Adjust in Data & Retention tab

3. **Are sampling rates too high?**
   - Lower them in Signals tab to reduce data collection

4. **Do I understand what data is being collected?**
   - Review transparency log regularly

5. **Can I export and delete my data if needed?**
   - Test export/delete functionality

## Regular Reviews

- [ ] Review privacy settings monthly
- [ ] Check transparency log for unusual activity
- [ ] Verify no new apps were automatically enabled
- [ ] Confirm data retention is working (old data deleted)

## Getting Help

If you have questions or concerns:
- Contact support (response within 30 days)
- Review privacy policy document
- Check "How It Works" documentation
- File a support ticket with specific questions

---

*Remember: You are in control. You can change settings, pause monitoring, or delete data at any time.*
