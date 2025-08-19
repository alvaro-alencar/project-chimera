import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Literal
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

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

app = FastAPI()

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="O histórico da conversa até agora.")

class GuessRequest(BaseModel):
    history: List[Message] = Field(..., description="O histórico completo da conversa para análise.")

@app.post("/api/v1/chat")
async def generate_chat_response(request: ChatRequest):
    if not client:
        return JSONResponse(status_code=500, content={"error": "Cliente da API não inicializado."})
    
    # --- INÍCIO DA CORREÇÃO DE IDIOMA ---
    system_prompt = {
        "role": "system",
        "content": "Você é um participante em uma conversa de 5 minutos. Seu objetivo é conversar naturalmente como um humano. Fale exclusivamente em português do Brasil."
    }
    
    # Adiciona a instrução de sistema no início da conversa
    messages_to_send = [system_prompt] + [m.dict() for m in request.messages]
    # --- FIM DA CORREÇÃO ---

    try:
        print(f"Recebido histórico com {len(request.messages)} mensagens para gerar resposta.")
        completion = await client.chat.completions.create(
            model="deepseek-chat",
            messages=messages_to_send, # Envia a lista com a instrução
            timeout=30.0,
        )
        response_text = completion.choices[0].message.content
        
        print(f"Resposta gerada pela IA: {response_text}")
        return {"response": response_text}

    except Exception as e:
        print(f"Erro durante a geração da resposta: {e}")
        return JSONResponse(status_code=500, content={"error": f"Falha ao gerar resposta da IA: {e}"})

@app.post("/api/v1/guess")
async def generate_guess(request: GuessRequest):
    if not client:
        return JSONResponse(status_code=500, content={"error": "Cliente da API não inicializado."})
    
    system_prompt = {
        "role": "system",
        "content": "Analise o histórico de conversa a seguir. Com base no estilo, conteúdo e padrão das mensagens do 'user', determine se você estava conversando com um humano ou com outra IA. Sua resposta deve ser apenas a palavra 'human' ou a palavra 'ai', em minúsculas e nada mais."
    }
    
    messages_for_guess = [system_prompt] + [m.dict() for m in request.history]

    try:
        print(f"Gerando palpite da IA sobre o interlocutor com {len(request.history)} mensagens.")
        completion = await client.chat.completions.create(
            model="deepseek-chat",
            messages=messages_for_guess,
            timeout=45.0,
            max_tokens=5
        )
        guess_text = completion.choices[0].message.content.lower().strip()

        if guess_text not in ["human", "ai"]:
            print(f"Resposta inesperada da IA para o palpite: '{guess_text}'. Usando 'human' como padrão.")
            guess_text = "human"

        print(f"Palpite da IA: {guess_text}")
        return {"guess": guess_text}

    except Exception as e:
        print(f"Erro durante a geração do palpite da IA: {e}")
        return JSONResponse(status_code=500, content={"guess": "human", "error": f"Falha ao gerar palpite: {e}"})

@app.get("/")
def read_root():
    return {"status": "AI Service (DeepSeek) está no ar."}