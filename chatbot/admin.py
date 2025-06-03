from django.contrib import admin
from .models import MedicalCategory, TrainingQuestion, ChatSession, ChatMessage

@admin.register(MedicalCategory)
class MedicalCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(TrainingQuestion)
class TrainingQuestionAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'created_at', 'updated_at')
    list_filter = ('category', 'created_at')
    search_fields = ('question', 'answer')

class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('sender', 'content', 'timestamp')

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'started_at', 'ended_at')
    list_filter = ('started_at', 'ended_at')
    search_fields = ('user__username',)
    inlines = [ChatMessageInline]

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender', 'content', 'timestamp')
    list_filter = ('sender', 'timestamp')
    search_fields = ('content',)
