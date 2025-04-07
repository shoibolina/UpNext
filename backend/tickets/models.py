import uuid
from django.db import models
from django.conf import settings
from events.models import Event, EventAttendee

class Ticket(models.Model):
    """
    Model representing an event ticket issued to an attendee.
    """
    TICKET_STATUS_CHOICES = (
        ('active', 'Active'),
        ('used', 'Used'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    attendee = models.ForeignKey(EventAttendee, on_delete=models.CASCADE, related_name='tickets')
    
    ticket_number = models.CharField(max_length=50, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=TICKET_STATUS_CHOICES, default='active')
    
    issue_date = models.DateTimeField(auto_now_add=True)
    used_date = models.DateTimeField(null=True, blank=True)
    
    qr_code = models.ImageField(upload_to='ticket_qrcodes/', blank=True, null=True)
    
    # Additional fields for special ticket types
    ticket_type = models.CharField(max_length=50, default='standard')  # standard, vip, early_bird, etc.
    seat_info = models.CharField(max_length=100, blank=True)  # For reserved seating events
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Amount paid for ticket
    
    def save(self, *args, **kwargs):
        # Generate ticket number if not provided
        if not self.ticket_number:
            # Format: EVENT-{event_id}-{random_uuid_segment}
            event_id = str(self.event.id).zfill(6)  # Pad with zeros for consistent length
            uuid_segment = str(uuid.uuid4()).split('-')[0]  # Use first segment of UUID
            self.ticket_number = f"EVENT-{event_id}-{uuid_segment}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Ticket #{self.ticket_number} for {self.event.title}"
    
    class Meta:
        ordering = ['-issue_date']


class TicketVerification(models.Model):
    """
    Model for tracking ticket verifications.
    """
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='verifications')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                    null=True, related_name='tickets_verified')
    verification_date = models.DateTimeField(auto_now_add=True)
    verification_location = models.CharField(max_length=255, blank=True)  # Optional location data
    verification_notes = models.TextField(blank=True)  # Optional notes from the verifier
    
    def __str__(self):
        return f"Verification of {self.ticket.ticket_number} by {self.verified_by.username}"
    
    class Meta:
        ordering = ['-verification_date']