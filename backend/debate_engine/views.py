from rest_framework import views, status
from rest_framework.response import Response
from .firebase_service import FirebaseService
from .models import Debate, DebateRound
import os
from openai import OpenAI
from typing import Dict, Any

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class DebateView(views.APIView):
    def post(self, request):
        try:
            topic = request.data.get('topic')
            description = request.data.get('description')
            participant_1 = request.data.get('participant_1')
            participant_2 = request.data.get('participant_2')
            
            if not all([topic, description, participant_1, participant_2]):
                return Response(
                    {'error': 'Missing required fields'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            debate = FirebaseService.create_debate(
                topic=topic,
                description=description,
                participant_1=participant_1,
                participant_2=participant_2
            )
            
            return Response(self._serialize_debate(debate), status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request, debate_id=None):
        try:
            if debate_id:
                debate = FirebaseService.get_debate(debate_id)
                if not debate:
                    return Response(
                        {'error': 'Debate not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                return Response(self._serialize_debate(debate))
            
            # TODO: Implement listing all debates
            return Response({'error': 'List all debates not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _serialize_debate(self, debate: Debate) -> Dict[str, Any]:
        return {
            'id': debate.id,
            'topic': debate.topic,
            'description': debate.description,
            'participant_1': debate.participant_1,
            'participant_2': debate.participant_2,
            'status': debate.status,
            'created_at': debate.created_at,
            'updated_at': debate.updated_at,
            'winner': debate.winner,
            'rounds': [self._serialize_round(r) for r in debate.rounds]
        }
    
    def _serialize_round(self, round: DebateRound) -> Dict[str, Any]:
        return {
            'id': round.id,
            'debate_id': round.debate_id,
            'round_number': round.round_number,
            'participant_1_argument': round.participant_1_argument,
            'participant_2_argument': round.participant_2_argument,
            'created_at': round.created_at
        }

class DebateRoundView(views.APIView):
    def post(self, request, debate_id):
        try:
            debate = FirebaseService.get_debate(debate_id)
            if not debate:
                return Response(
                    {'error': 'Debate not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the next round number
            next_round = len(debate.rounds) + 1
            
            # Generate arguments using OpenAI
            participant_1_argument = self._generate_argument(
                debate.topic,
                debate.participant_1,
                debate.rounds,
                is_first_participant=True
            )
            
            participant_2_argument = self._generate_argument(
                debate.topic,
                debate.participant_2,
                debate.rounds,
                is_first_participant=False
            )
            
            # Create the new round
            new_round = FirebaseService.add_debate_round(
                debate_id=debate_id,
                round_number=next_round,
                participant_1_argument=participant_1_argument,
                participant_2_argument=participant_2_argument
            )
            
            return Response(
                self._serialize_round(new_round),
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_argument(self, topic: str, participant: str, rounds: List[DebateRound], is_first_participant: bool) -> str:
        # Construct the conversation history
        messages = [
            {"role": "system", "content": f"You are {participant} participating in a debate about: {topic}"}
        ]
        
        # Add previous rounds to the context
        for round in rounds:
            if is_first_participant:
                messages.append({"role": "assistant", "content": round.participant_1_argument})
                if round.participant_2_argument:
                    messages.append({"role": "user", "content": round.participant_2_argument})
            else:
                messages.append({"role": "user", "content": round.participant_1_argument})
                if round.participant_2_argument:
                    messages.append({"role": "assistant", "content": round.participant_2_argument})
        
        # Generate the response
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    
    def _serialize_round(self, round: DebateRound) -> Dict[str, Any]:
        return {
            'id': round.id,
            'debate_id': round.debate_id,
            'round_number': round.round_number,
            'participant_1_argument': round.participant_1_argument,
            'participant_2_argument': round.participant_2_argument,
            'created_at': round.created_at
        }