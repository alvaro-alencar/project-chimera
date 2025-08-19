from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRoom(BaseModel):
    roomId: str
    isAiRoom: bool

class Vote(BaseModel):
    roomId: str
    guess: Literal["human", "ai"]
    voterType: Optional[Literal["human", "ai"]] = "human"

class VoteInfo(BaseModel):
    voter: Literal["human", "ai"]
    guess: Literal["human", "ai"]
    correct: bool

class RoomInfo(BaseModel):
    isAiRoom: bool
    votes: List[VoteInfo] = []

rooms: Dict[str, RoomInfo] = {}

@app.post("/internal/api/rooms/register")
def register_room(payload: RegisterRoom):
    rooms[payload.roomId] = RoomInfo(isAiRoom=payload.isAiRoom, votes=[])
    print(f"Sala registrada: {payload.roomId}, IA: {payload.isAiRoom}")
    return {"status": "registered"}

@app.post("/api/v1/vote")
def submit_vote(vote: Vote):
    room = rooms.get(vote.roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não registrada")
    
    opponent_was_ai = False
    if vote.voterType == "human":
        opponent_was_ai = room.isAiRoom
    elif vote.voterType == "ai":
        opponent_was_ai = False

    actual = "ai" if opponent_was_ai else "human"
    correct = vote.guess == actual

    vote_info = VoteInfo(voter=vote.voterType, guess=vote.guess, correct=correct)
    room.votes.append(vote_info)
    
    print(f"Voto recebido para sala {vote.roomId}: {{ Votante: {vote.voterType}, Palpite: {vote.guess}, Correto: {correct} }}")
    
    return {"correct": correct}

@app.get("/api/v1/stats")
def get_stats():
    human_vs_ai_votes = [v for r in rooms.values() for v in r.votes if r.isAiRoom and v.voter == 'human']
    ai_vs_human_votes = [v for r in rooms.values() for v in r.votes if r.isAiRoom and v.voter == 'ai']
    
    total_human_vs_ai = len(human_vs_ai_votes)
    correct_human_vs_ai = sum(1 for v in human_vs_ai_votes if v.correct)
    accuracy_human_vs_ai = (correct_human_vs_ai / total_human_vs_ai) if total_human_vs_ai else 0

    total_ai_vs_human = len(ai_vs_human_votes)
    correct_ai_vs_human = sum(1 for v in ai_vs_human_votes if v.correct)
    accuracy_ai_vs_human = (correct_ai_vs_human / total_ai_vs_human) if total_ai_vs_human else 0

    total_votes = sum(len(room.votes) for room in rooms.values())
    correct_guesses = sum(sum(1 for v in room.votes if v.correct) for room in rooms.values())
    
    return {
        "human_vs_ai": {
            "total": total_human_vs_ai,
            "correct": correct_human_vs_ai,
            "accuracy": accuracy_human_vs_ai
        },
        "ai_vs_human": {
            "total": total_ai_vs_human,
            "correct": correct_ai_vs_human,
            "accuracy": accuracy_ai_vs_human
        },
        "overall": {
            "totalVotes": total_votes,
            "correctGuesses": correct_guesses
        }
    }

@app.get("/")
def root():
    return {"status": "Voting Service está no ar."}