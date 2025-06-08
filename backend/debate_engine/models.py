from django.db import models
from django.contrib.auth.models import User

class Debate(models.Model):
    topic = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    rounds = models.IntegerField(default=3)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )

    class Meta:
        ordering = ['-created_at']

class AIParticipant(models.Model):
    debate = models.ForeignKey(Debate, related_name='participants', on_delete=models.CASCADE)
    model_name = models.CharField(max_length=50)
    temperature = models.FloatField()
    max_tokens = models.IntegerField()
    system_prompt = models.TextField()
    position = models.IntegerField()  # 1 or 2 to indicate first or second debater

class DebateRound(models.Model):
    debate = models.ForeignKey(Debate, related_name='rounds', on_delete=models.CASCADE)
    round_number = models.IntegerField()
    participant = models.ForeignKey(AIParticipant, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['round_number', 'created_at']
        unique_together = ['debate', 'round_number', 'participant']