"""Email templates for referral invitations and notifications."""

REFERRAL_INVITE_EMAIL_TEMPLATE = """
Subject: {inviter_name} invited you to try Floyo

Hi {invitee_name},

{inviter_name} thinks you'd love Floyo - a tool that automatically discovers workflow patterns and suggests integrations to automate your work.

Get started with your referral code: {referral_code}

Sign up here: {referral_link}

What is Floyo?
Floyo watches how you work and suggests concrete integrations based on your actual usage patterns. No guessing, no generic advice - just real suggestions.

Benefits:
- Save 2-3 hours/day on manual data sync
- Discover automation opportunities you didn't know existed
- Optimize your tool stack and save money

Start free, no credit card required.

Best,
The Floyo Team

---
You're receiving this because {inviter_name} thought you'd find Floyo useful.
If you'd prefer not to receive these emails, you can unsubscribe.
"""

REFERRAL_REWARD_EMAIL_TEMPLATE = """
Subject: You earned a reward! 🎉

Hi {referrer_name},

Great news! {referred_name} signed up using your referral code.

Reward: {reward_description}

Keep sharing Floyo to earn more rewards!

Your referral stats:
- Total referrals: {total_referrals}
- Rewards earned: {total_rewards}

Share your referral link: {referral_link}

Thanks for spreading the word!

Best,
The Floyo Team
"""

REFERRAL_SIGNUP_CONFIRMATION_TEMPLATE = """
Subject: Welcome to Floyo! 🚀

Hi {new_user_name},

Welcome to Floyo! You signed up using {referrer_name}'s referral code.

As a thank you, you get: {new_user_reward}

Get started:
1. Install the Floyo CLI: pip install floyo
2. Run: floyo watch
3. Check your dashboard: {dashboard_link}

Need help? Check out our docs: {docs_link}

Happy automating!

Best,
The Floyo Team
"""

def render_referral_invite_email(
    inviter_name: str,
    invitee_name: str,
    invitee_email: str,
    referral_code: str,
    referral_link: str
) -> dict:
    """Render referral invitation email."""
    return {
        "to": invitee_email,
        "subject": f"{inviter_name} invited you to try Floyo",
        "html": REFERRAL_INVITE_EMAIL_TEMPLATE.format(
            inviter_name=inviter_name,
            invitee_name=invitee_name or invitee_email.split("@")[0],
            referral_code=referral_code,
            referral_link=referral_link
        ),
        "text": REFERRAL_INVITE_EMAIL_TEMPLATE.format(
            inviter_name=inviter_name,
            invitee_name=invitee_name or invitee_email.split("@")[0],
            referral_code=referral_code,
            referral_link=referral_link
        ),
    }

def render_referral_reward_email(
    referrer_name: str,
    referrer_email: str,
    referred_name: str,
    reward_description: str,
    total_referrals: int,
    total_rewards: int,
    referral_link: str
) -> dict:
    """Render referral reward notification email."""
    return {
        "to": referrer_email,
        "subject": "You earned a reward! 🎉",
        "html": REFERRAL_REWARD_EMAIL_TEMPLATE.format(
            referrer_name=referrer_name,
            referred_name=referred_name,
            reward_description=reward_description,
            total_referrals=total_referrals,
            total_rewards=total_rewards,
            referral_link=referral_link
        ),
        "text": REFERRAL_REWARD_EMAIL_TEMPLATE.format(
            referrer_name=referrer_name,
            referred_name=referred_name,
            reward_description=reward_description,
            total_referrals=total_referrals,
            total_rewards=total_rewards,
            referral_link=referral_link
        ),
    }

def render_signup_confirmation_email(
    new_user_name: str,
    new_user_email: str,
    referrer_name: str,
    new_user_reward: str,
    dashboard_link: str,
    docs_link: str
) -> dict:
    """Render signup confirmation email with referral info."""
    return {
        "to": new_user_email,
        "subject": "Welcome to Floyo! 🚀",
        "html": REFERRAL_SIGNUP_CONFIRMATION_TEMPLATE.format(
            new_user_name=new_user_name or new_user_email.split("@")[0],
            referrer_name=referrer_name,
            new_user_reward=new_user_reward,
            dashboard_link=dashboard_link,
            docs_link=docs_link
        ),
        "text": REFERRAL_SIGNUP_CONFIRMATION_TEMPLATE.format(
            new_user_name=new_user_name or new_user_email.split("@")[0],
            referrer_name=referrer_name,
            new_user_reward=new_user_reward,
            dashboard_link=dashboard_link,
            docs_link=docs_link
        ),
    }
