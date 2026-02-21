# 📋 Exemplos de JSON Retornado pela API

## 🎯 Endpoint Principal: `POST /send-message`

### ✅ Resposta de Sucesso

Quando a mensagem é enviada com sucesso, o endpoint retorna:

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

**Campos:**
- `success`: `true` indica sucesso
- `data.messageId`: ID único da mensagem no WhatsApp
- `data.to`: JID completo do destinatário
- `data.message`: Mensagem que foi enviada
- `data.timestamp`: Timestamp em milissegundos
- `data.sentAt`: Data/hora em formato ISO 8601
- `timestamp`: Timestamp da resposta da API

---

### ❌ Resposta de Erro - WhatsApp Desconectado

Quando o WhatsApp não está conectado:

```json
{
  "success": false,
  "error": "WhatsApp não está conectado",
  "message": "Aguarde a conexão ser estabelecida",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Status HTTP:** `503 Service Unavailable`

---

### ❌ Resposta de Erro - Campo "to" Faltando

Quando o campo `to` não é fornecido:

```json
{
  "success": false,
  "error": "Campo \"to\" é obrigatório",
  "message": "Forneça o número de telefone ou JID do destinatário",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Status HTTP:** `400 Bad Request`

---

### ❌ Resposta de Erro - Campo "message" Faltando

Quando o campo `message` não é fornecido:

```json
{
  "success": false,
  "error": "Campo \"message\" é obrigatório",
  "message": "Forneça a mensagem a ser enviada",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Status HTTP:** `400 Bad Request`

---

### ❌ Resposta de Erro - Número Inválido

Quando o número de telefone é inválido:

```json
{
  "success": false,
  "error": "Número de telefone inválido",
  "message": "O número deve ter pelo menos 10 dígitos",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Status HTTP:** `400 Bad Request`

---

### ❌ Resposta de Erro - Erro no Envio

Quando ocorre um erro ao enviar a mensagem:

```json
{
  "success": false,
  "error": "Erro ao enviar mensagem",
  "message": "Descrição do erro específico",
  "details": "Stack trace completo do erro (apenas em desenvolvimento)",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Status HTTP:** `500 Internal Server Error`

---

## 🔍 Endpoint de Health Check: `GET /health`

### ✅ Resposta quando conectado:

```json
{
  "status": "ok",
  "whatsappConnected": true,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### ⚠️ Resposta quando desconectado:

```json
{
  "status": "ok",
  "whatsappConnected": false,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Status HTTP:** `200 OK` (sempre, pois a API está funcionando)

---

## 📤 Exemplo Completo de Requisição e Resposta

### Requisição do TH_BRAIN:

```http
POST /send-message HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "to": "5511999999999",
  "message": "Olá! Esta mensagem foi processada pelo TH_BRAIN e está sendo enviada via TH_BRIDGE."
}
```

### Resposta do TH_BRIDGE:

```json
{
  "success": true,
  "data": {
    "messageId": "3EB0123456789ABCDEF",
    "to": "5511999999999@s.whatsapp.net",
    "message": "Olá! Esta mensagem foi processada pelo TH_BRAIN e está sendo enviada via TH_BRIDGE.",
    "timestamp": 1769221827000,
    "sentAt": "2025-01-15T10:30:27.000Z"
  },
  "timestamp": "2025-01-15T10:30:27.000Z"
}
```

**Status HTTP:** `200 OK`

---

## 🔄 Fluxo Completo TH_BRAIN → TH_BRIDGE → WhatsApp

```
1. TH_BRAIN recebe mensagem do usuário
   ↓
2. TH_BRAIN processa regras de negócio
   ↓
3. TH_BRAIN faz POST para TH_BRIDGE:
   POST http://localhost:3000/send-message
   {
     "to": "5511999999999",
     "message": "Resposta processada"
   }
   ↓
4. TH_BRIDGE envia para WhatsApp
   ↓
5. TH_BRIDGE retorna JSON:
   {
     "success": true,
     "data": { ... }
   }
   ↓
6. TH_BRAIN recebe confirmação
```

---

## 💡 Dicas de Uso

1. **Sempre verifique `success`**: O campo `success` indica se a operação foi bem-sucedida
2. **Use `messageId` para tracking**: Guarde o `messageId` para rastrear mensagens
3. **Trate erros adequadamente**: Verifique o `error` e `message` em caso de falha
4. **Verifique conexão antes**: Use `/health` para verificar se WhatsApp está conectado
5. **Normalização automática**: Não precisa se preocupar com formato do número, o sistema normaliza

---

**Documentação completa:** Veja `API_DOCUMENTATION.md` para mais detalhes.

