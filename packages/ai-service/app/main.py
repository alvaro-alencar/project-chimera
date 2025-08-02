import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Literal
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# --- Configuração do Cliente da API (DeepSeek) ---
try:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("A variável de ambiente DEEPSEEK_API_KEY não foi encontrada.")
    
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com/v1"
    )
    print("Cliente da API DeepSeek configurado com sucesso.")

except Exception as e:
    print(f"Erro ao configurar o cliente da API: {e}")
    client = None

# --- Definição da API com FastAPI ---
app = FastAPI()

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="O histórico da conversa até agora.")

@app.post("/api/v1/chat")
async def generate_chat_response(request: ChatRequest):
    if not client:
        return JSONResponse(status_code=500, content={"error": "Cliente da API não inicializado."})
    
    try:
        print(f"Recebido histórico com {len(request.messages)} mensagens.")
        
        # --- DIAGNÓSTICOS ADICIONADOS ---
        print("Enviando requisição para a API do DeepSeek...")
        completion = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[m.dict() for m in request.messages],
            timeout=30.0, # Adiciona um timeout de 30 segundos
        )
        print("Recebida resposta da API do DeepSeek.")
        # --- FIM DOS DIAGNÓSTICOS ---
        
        response_text = completion.choices[0].message.content
        
        print(f"Resposta gerada pela IA: {response_text}")
        return {"response": response_text}

    except Exception as e:
        print(f"Erro durante a geração da resposta: {e}")
        return JSONResponse(status_code=500, content={"error": f"Falha ao gerar resposta da IA: {e}"})

@app.get("/")
def read_root():
    return {"status": "AI Service (DeepSeek) está no ar."}