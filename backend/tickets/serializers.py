# tickets/serializers.py
import base64
from io import BytesIO
import qrcode
from django.core.files import File
from rest_framework import serializers
from .models import Ticket, TicketVerification
from events.serializers import EventSerializer
from users.serializers import UserSerializer

class TicketVerificationSerializer(serializers.ModelSerializer):
    verified_by = UserSerializer(read_only=True)
    ticket = serializers.SerializerMethodField()  # Override the default FK field with a method field
    
    class Meta:
        model = TicketVerification
        fields = ('id', 'ticket', 'verified_by', 'verification_date', 
                  'verification_location', 'verification_notes')
        read_only_fields = ('id', 'verified_by', 'verification_date')
    
    def get_ticket(self, obj):
        # Return the full serialized ticket instead of just the ID
        # This ensures backward compatibility with existing frontend
        return TicketSerializer(obj.ticket, context=self.context).data

class TicketSerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)
    attendee_name = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = (
            'id', 'ticket_number', 'event', 'event_details', 'attendee', 
            'attendee_name', 'status', 'issue_date', 'used_date', 
            'qr_code', 'qr_code_url', 'ticket_type', 'seat_info', 'price_paid'
        )
        read_only_fields = ('id', 'ticket_number', 'event', 'attendee', 
                            'issue_date', 'qr_code', 'qr_code_url')
    
    def get_attendee_name(self, obj):
        return f"{obj.attendee.user.first_name} {obj.attendee.user.last_name}"
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None
    
    def create(self, validated_data):
        # Inject event and attendee from context if provided.
        event = self.context.get('event')
        attendee = self.context.get('attendee')
        if event:
            validated_data['event'] = event
        if attendee:
            validated_data['attendee'] = attendee
        
        # Create the ticket instance.
        ticket = super().create(validated_data)
        
        # Create QR code containing ticket verification information.
        qr_data = {
            'ticket_id': str(ticket.id),
            'ticket_number': ticket.ticket_number,
            'event_id': str(ticket.event.id),
            'event_title': ticket.event.title,
            'attendee_id': str(ticket.attendee.user.id),
        }
        
        # Convert to string for QR code.
        qr_content = f"UPNEXT-TICKET:{base64.b64encode(str(qr_data).encode()).decode()}"
        
        # Generate QR code image.
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        # Create an image from the QR Code.
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save the image to a BytesIO object.
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Save the BytesIO object as the image field.
        filename = f'ticket_qr_{ticket.ticket_number}.png'
        ticket.qr_code.save(filename, File(buffer), save=True)
        
        return ticket

class TicketVerificationCreateSerializer(serializers.ModelSerializer):
    ticket_number = serializers.CharField(write_only=True)
    ticket = serializers.SerializerMethodField()  # Add a serialized ticket field
    
    class Meta:
        model = TicketVerification
        fields = ('ticket_number', 'ticket', 'verification_location', 'verification_notes')
    
    def get_ticket(self, obj):
        # Return the serialized ticket
        return TicketSerializer(obj.ticket, context=self.context).data
    
    def validate_ticket_number(self, value):
        try:
            ticket = Ticket.objects.get(ticket_number=value)
            if ticket.status != 'active':
                raise serializers.ValidationError(f"Ticket is not active. Current status: {ticket.status}")
            return value
        except Ticket.DoesNotExist:
            raise serializers.ValidationError("Invalid ticket number")
    
    def create(self, validated_data):
        ticket_number = validated_data.pop('ticket_number')
        ticket = Ticket.objects.get(ticket_number=ticket_number)
        
        # Mark the ticket as used.
        ticket.status = 'used'
        ticket.save()
        
        # Create the verification record.
        verification = TicketVerification.objects.create(
            ticket=ticket,
            verified_by=self.context['request'].user,
            **validated_data
        )
        
        return verification