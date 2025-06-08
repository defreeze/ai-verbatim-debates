from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Debate, AIParticipant, DebateRound
from .serializers import DebateSerializer, AIParticipantSerializer, DebateRoundSerializer

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from typing import Dict, TypedDict, Annotated
import os

class DebateState(TypedDict):
    topic: str
    current_round: int
    total_rounds: int
    history: list[dict]
    current_speaker: int

class DebateViewSet(viewsets.ModelViewSet):
    queryset = Debate.objects.all()
    serializer_class = DebateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        debate = serializer.save(created_by=self.request.user)
        self._setup_debate_participants(debate)

    def _setup_debate_participants(self, debate):
        participant_data = self.request.data.get('participants', [])
        for i, data in enumerate(participant_data, 1):
            AIParticipant.objects.create(
                debate=debate,
                position=i,
                **data
            )

    @action(detail=True, methods=['post'])
    def start_debate(self, request, pk=None):
        debate = self.get_object()
        if debate.status != 'pending':
            return Response(
                {'error': 'Debate has already started'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            debate_chain = self._create_debate_chain(debate)
            initial_state = self._create_initial_state(debate)
            
            # Start the debate process
            debate.status = 'in_progress'
            debate.save()
            
            # Run the debate chain
            final_state = debate_chain.invoke(initial_state)
            
            # Update debate status
            debate.status = 'completed'
            debate.save()
            
            return Response(self.get_serializer(debate).data)
        except Exception as e:
            debate.status = 'failed'
            debate.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _create_debate_chain(self, debate):
        # Create LangGraph chain for debate
        workflow = StateGraph(DebateState)

        def should_continue(state: DebateState) -> bool:
            return state['current_round'] < state['total_rounds']

        def generate_response(state: DebateState) -> DebateState:
            current_speaker = state['current_speaker']
            participant = debate.participants.get(position=current_speaker)
            
            llm = ChatOpenAI(
                model_name=participant.model_name,
                temperature=participant.temperature
            )
            
            # Prepare context from debate history
            context = "\n".join([
                f"Speaker {entry['speaker']}: {entry['content']}"
                for entry in state['history']
            ])
            
            # Generate response
            response = llm.invoke(
                f"""Topic: {state['topic']}
                Previous arguments:
                {context}
                
                You are Speaker {current_speaker}. {participant.system_prompt}
                Provide your argument for this debate round."""
            )
            
            # Save to database
            DebateRound.objects.create(
                debate=debate,
                round_number=state['current_round'],
                participant=participant,
                content=response.content
            )
            
            # Update state
            state['history'].append({
                'speaker': current_speaker,
                'content': response.content
            })
            
            # Switch speakers and increment round if needed
            state['current_speaker'] = 2 if current_speaker == 1 else 1
            if state['current_speaker'] == 1:
                state['current_round'] += 1
            
            return state

        # Add nodes to the graph
        workflow.add_node("generate_response", generate_response)
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "generate_response",
            should_continue,
            {
                True: "generate_response",
                False: END
            }
        )
        
        # Set entry point
        workflow.set_entry_point("generate_response")
        
        return workflow.compile()

    def _create_initial_state(self, debate) -> DebateState:
        return {
            'topic': debate.topic,
            'current_round': 0,
            'total_rounds': debate.rounds,
            'history': [],
            'current_speaker': 1
        }