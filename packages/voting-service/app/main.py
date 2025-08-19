from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List

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
    guess: str  # "human" or "ai"

class RoomInfo(BaseModel):
    isAiRoom: bool
    votes: List[bool]

rooms: Dict[str, RoomInfo] = {}

@app.post("/internal/api/rooms/register")
def register_room(payload: RegisterRoom):
    rooms[payload.roomId] = RoomInfo(isAiRoom=payload.isAiRoom, votes=[])
    return {"status": "registered"}

@app.post("/api/v1/vote")
def submit_vote(vote: Vote):
    room = rooms.get(vote.roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não registrada")
    actual = "ai" if room.isAiRoom else "human"
    correct = vote.guess == actual
    room.votes.append(correct)
    return {"correct": correct}

@app.get("/api/v1/stats")
def get_stats():
    total_votes = sum(len(room.votes) for room in rooms.values())
    correct_guesses = sum(sum(1 for v in room.votes if v) for room in rooms.values())
    accuracy = (correct_guesses / total_votes) if total_votes else 0
    return {
        "totalVotes": total_votes,
        "correctGuesses": correct_guesses,
        "accuracy": accuracy,
    }

@app.get("/")
def root():
    return {"status": "Voting Service está no ar."}
