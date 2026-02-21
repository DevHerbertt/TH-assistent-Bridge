# 📡 Documentação da API - TH Bridge

API HTTP para comunicação com o TH_BRAIN e envio de mensagens via WhatsApp.

## 🌐 Base URL

```
http://localhost:3000
```

(Porta padrão: 3000, pode ser alterada via variável de ambiente `PORT`)

---

## 📋 Endpoints

### 1. Health Check

Verifica o status da conexão do WhatsApp.

**Endpoint:** `GET /health`

**Resposta de Sucesso (200):**

```json
{
  "status": "ok",
  "whatsappConnected": true,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Resposta quando desconectado:**

```json
{
  "status": "ok",
  "whatsappConnected": false,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### 2. Enviar Mensagem

Envia uma mensagem via WhatsApp. Este é o endpoint principal para o TH_BRAIN consumir.

**Endpoint:** `POST /send-message`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "to": "5511999999999",
  "message": "Mensagem processada pelo TH_BRAIN"
}
```

**Parâmetros:**
- `to` (obrigatório): Número de telefone do destinatário
  - Pode ser apenas número: `"5511999999999"`
  - Ou JID completo: `"5511999999999@s.whatsapp.net"`
  - O sistema normaliza automaticamente
- `message` (obrigatório): Texto da mensagem a ser enviada

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "messageId": "3EB0ABCD1234",
    "to": "5511999999999@s.whatsapp.net",
    "message": "Mensagem processada pelo TH_BRAIN",
    "timestamp": 1769221827000,
    "sentAt": "2025-01-15T10:30:27.000Z"
  },
  "timestamp": "2025-01-15T10:30:27.000Z"
}
```

**Resposta de Erro - WhatsApp Desconectado (503):**

```json
{
  "success": false,
  "error": "WhatsApp não está conectado",
  "message": "Aguarde a conexão ser estabelecida",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Resposta de Erro - Dados Inválidos (400):**

```json
{
  "success": false,
  "error": "Campo \"to\" é obrigatório",
  "message": "Forneça o número de telefone ou JID do destinatário",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

```json
{
  "success": false,
  "error": "Campo \"message\" é obrigatório",
  "message": "Forneça a mensagem a ser enviada",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

```json
{
  "success": false,
  "error": "Número de telefone inválido",
  "message": "O número deve ter pelo menos 10 dígitos",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Resposta de Erro - Erro no Envio (500):**

```json
{
  "success": false,
  "error": "Erro ao enviar mensagem",
  "message": "Descrição do erro",
  "details": "Stack trace do erro",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### 3. Webhook de Mensagens

Endpoint para receber notificações (futuro uso).

**Endpoint:** `POST /webhook/message`

**Resposta:**

```json
{
  "success": true,
  "message": "Webhook recebido",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 🔄 Fluxo de Integração com TH_BRAIN

### Cenário 1: TH_BRAIN envia mensagem processada

```
TH_BRAIN → POST /send-message
         → TH_BRIDGE processa
         → Envia para WhatsApp
         → Retorna JSON com resultado
```

**Exemplo de Requisição do TH_BRAIN:**

```javascript
const response = await fetch('http://localhost:3000/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '5511999999999',
    message: 'Resposta processada pelo TH_BRAIN após análise da mensagem'
  })
});

const result = await response.json();
console.log(result);
```

**Resposta Recebida:**

```json
{
  "success": true,
  "data": {
    "messageId": "3EB0ABCD1234",
    "to": "5511999999999@s.whatsapp.net",
    "message": "Resposta processada pelo TH_BRAIN após análise da mensagem",
    "timestamp": 1769221827000,
    "sentAt": "2025-01-15T10:30:27.000Z"
  },
  "timestamp": "2025-01-15T10:30:27.000Z"
}
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Enviar mensagem simples

```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste."
  }'
```

### Exemplo 2: Verificar status

```bash
curl http://localhost:3000/health
```

### Exemplo 3: JavaScript/Node.js

```javascript
const axios = require('axios');

async function enviarMensagem(numero, mensagem) {
  try {
    const response = await axios.post('http://localhost:3000/send-message', {
      to: numero,
      message: mensagem
    });
    
    console.log('Mensagem enviada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
enviarMensagem('5511999999999', 'Mensagem do TH_BRAIN');
```

### Exemplo 4: Python

```python
import requests

def enviar_mensagem(numero, mensagem):
    url = 'http://localhost:3000/send-message'
    payload = {
        'to': numero,
        'message': mensagem
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Uso
resultado = enviar_mensagem('5511999999999', 'Mensagem do TH_BRAIN')
print(resultado)
```

---

## 🔒 Segurança

- A API aceita requisições de qualquer origem (CORS habilitado)
- Para produção, considere adicionar autenticação (API Key, JWT, etc.)
- Valide sempre os dados recebidos no TH_BRAIN antes de enviar

---

## ⚠️ Notas Importantes

1. **Normalização de Números**: O sistema normaliza automaticamente números de telefone
   - `11999999999` → `5511999999999@s.whatsapp.net`
   - `5511999999999` → `5511999999999@s.whatsapp.net`
   - `5511999999999@s.whatsapp.net` → mantém como está

2. **Status de Conexão**: Sempre verifique `/health` antes de enviar mensagens

3. **Timeouts**: Configure timeouts adequados nas requisições do TH_BRAIN

4. **Retry**: Implemente retry logic no TH_BRAIN para casos de falha temporária

---

## 📊 Estrutura de Resposta Padrão

Todas as respostas seguem este formato:

**Sucesso:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "ISO 8601"
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Tipo do erro",
  "message": "Descrição do erro",
  "timestamp": "ISO 8601"
}
```

---

**Última atualização:** 2025-01-15


