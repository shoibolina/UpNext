import resend
import os
from decouple import config

# resend.api_key = os.getenv("RESEND_API_KEY")
# print("USING RESEND API KEY:", config("RESEND_API_KEY"))

resend.api_key = config("RESEND_API_KEY")
print("USING RESEND API KEY:", resend.api_key)

def send_password_reset_email(to_email: str, reset_link: str):
    resend.Emails.send({
        "from": "UpNext <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Reset Your Password",
        "html": f"""
            <h2>Reset your password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_link}">Reset Password</a>
        """
    })
