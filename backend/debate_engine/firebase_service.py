import os
from datetime import datetime
from typing import List, Optional
from firebase_admin import credentials, firestore, initialize_app
from .models import Debate, DebateRound

# Initialize Firebase Admin
cred = credentials.Certificate('firebase-credentials.json')
initialize_app(cred)
db = firestore.client()

class FirebaseService:
    @staticmethod
    def create_debate(topic: str, description: str, participant_1: str, participant_2: str) -> Debate:
        debate_ref = db.collection('debates').document()
        debate_data = {
            'topic': topic,
            'description': description,
            'participant_1': participant_1,
            'participant_2': participant_2,
            'status': 'pending',
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
        }
        debate_ref.set(debate_data)
        
        # Get the created debate with server timestamp
        debate_doc = debate_ref.get()
        debate_dict = debate_doc.to_dict()
        
        return Debate(
            id=debate_doc.id,
            topic=debate_dict['topic'],
            description=debate_dict['description'],
            participant_1=debate_dict['participant_1'],
            participant_2=debate_dict['participant_2'],
            status=debate_dict['status'],
            created_at=debate_dict['created_at'],
            updated_at=debate_dict['updated_at'],
            rounds=[]
        )

    @staticmethod
    def get_debate(debate_id: str) -> Optional[Debate]:
        debate_doc = db.collection('debates').document(debate_id).get()
        if not debate_doc.exists:
            return None
            
        debate_dict = debate_doc.to_dict()
        rounds = FirebaseService.get_debate_rounds(debate_id)
        
        return Debate(
            id=debate_doc.id,
            topic=debate_dict['topic'],
            description=debate_dict['description'],
            participant_1=debate_dict['participant_1'],
            participant_2=debate_dict['participant_2'],
            status=debate_dict['status'],
            created_at=debate_dict['created_at'],
            updated_at=debate_dict['updated_at'],
            rounds=rounds,
            winner=debate_dict.get('winner')
        )

    @staticmethod
    def get_debate_rounds(debate_id: str) -> List[DebateRound]:
        rounds_ref = (
            db.collection('debates')
            .document(debate_id)
            .collection('rounds')
            .order_by('round_number')
        )
        rounds = []
        for round_doc in rounds_ref.stream():
            round_dict = round_doc.to_dict()
            rounds.append(
                DebateRound(
                    id=round_doc.id,
                    debate_id=debate_id,
                    round_number=round_dict['round_number'],
                    participant_1_argument=round_dict['participant_1_argument'],
                    participant_2_argument=round_dict['participant_2_argument'],
                    created_at=round_dict['created_at']
                )
            )
        return rounds

    @staticmethod
    def add_debate_round(
        debate_id: str,
        round_number: int,
        participant_1_argument: str,
        participant_2_argument: str
    ) -> DebateRound:
        round_ref = (
            db.collection('debates')
            .document(debate_id)
            .collection('rounds')
            .document()
        )
        
        round_data = {
            'round_number': round_number,
            'participant_1_argument': participant_1_argument,
            'participant_2_argument': participant_2_argument,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        round_ref.set(round_data)
        
        # Update debate's updated_at timestamp
        db.collection('debates').document(debate_id).update({
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        # Get the created round with server timestamp
        round_doc = round_ref.get()
        round_dict = round_doc.to_dict()
        
        return DebateRound(
            id=round_doc.id,
            debate_id=debate_id,
            round_number=round_dict['round_number'],
            participant_1_argument=round_dict['participant_1_argument'],
            participant_2_argument=round_dict['participant_2_argument'],
            created_at=round_dict['created_at']
        ) 