from django.contrib.auth.forms import PasswordResetForm

class CustomPasswordResetForm(PasswordResetForm):
    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
        print("✅ CustomPasswordResetForm.send_mail was called!")
        print("📬 Sending reset email to:", to_email)
        return super().send_mail(
            subject_template_name, email_template_name, context,
            from_email, to_email, html_email_template_name
        )

    def get_form_class(self):
        print("⚙️ get_form_class was called")
        return CustomPasswordResetForm

    def form_invalid(self, form):
        print("❌ CustomPasswordResetView.form_invalid was called")
        print("Errors:", form.errors)
        return super().form_invalid(form)
