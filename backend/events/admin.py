from django.contrib import admin
from .models import Event, EventCategory, EventAttendee, EventComment

@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'start_date', 'status', 'visibility', 'is_free')
    list_filter = ('status', 'visibility', 'is_free', 'categories')
    search_fields = ('title', 'description', 'organizer__email')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'start_date'
    filter_horizontal = ('categories',)

@admin.register(EventAttendee)
class EventAttendeeAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'status', 'registration_date')
    list_filter = ('status',)
    search_fields = ('event__title', 'user__email')
    date_hierarchy = 'registration_date'

@admin.register(EventComment)
class EventCommentAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'content', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('event__title', 'user__email', 'content')
    date_hierarchy = 'created_at'