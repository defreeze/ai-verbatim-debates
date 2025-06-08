from rest_framework import serializers
from .models import Debate, AIParticipant, DebateRound

class AIParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIParticipant
        fields = ['id', 'model_name', 'temperature', 'max_tokens', 'system_prompt', 'position']

class DebateRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebateRound
        fields = ['id', 'round_number', 'participant', 'content', 'created_at']

class DebateSerializer(serializers.ModelSerializer):
    participants = AIParticipantSerializer(many=True, read_only=True)
    rounds = DebateRoundSerializer(many=True, read_only=True)
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Debate
        fields = ['id', 'topic', 'created_at', 'created_by', 'rounds', 'status', 'participants']
        read_only_fields = ['created_at', 'created_by', 'status']

    def create(self, validated_data):
        participants_data = self.context['request'].data.get('participants', [])
        if len(participants_data) != 2:
            raise serializers.ValidationError("Exactly two AI participants are required")
        
        debate = Debate.objects.create(**validated_data)
        
        for i, participant_data in enumerate(participants_data, 1):
            AIParticipant.objects.create(
                debate=debate,
                position=i,
                **participant_data
            )
        
        return debate