from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class Debate:
    id: str
    topic: str
    description: str
    participant_1: str
    participant_2: str
    status: str
    created_at: datetime
    updated_at: datetime
    rounds: List['DebateRound']
    winner: Optional[str] = None

@dataclass
class DebateRound:
    id: str
    debate_id: str
    round_number: int
    participant_1_argument: str
    participant_2_argument: str
    created_at: datetime