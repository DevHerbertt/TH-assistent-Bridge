# 📤 JSON Enviado do TH_BRIDGE para o TH_BRAIN

## 🎯 Endpoint do TH_BRAIN

O TH_BRIDGE envia mensagens recebidas do WhatsApp para o TH_BRAIN no seguinte endpoint:

```
POST http://localhost:3001/api/process
```

(URL configurável via variável de ambiente `TH_BRAIN_URL`)

---

## 📋 JSON Enviado

Quando uma mensagem é recebida no WhatsApp, o TH_BRIDGE envia automaticamente este JSON para o TH_BRAIN:

```json
{
  "from": "5511999999999@s.whatsapp.net",
  "text": "Texto da mensagem recebida",
  "timestamp": 1769221827000,
  "pushName": "Nome do Contato",
  "messageId": "3EB0ABCD1234",
  "isGroup": false,
  "messageType": "conversation",
  "deviceType": "whatsapp"
}
```

---

## 📊 Detalhamento dos Campos

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `from` | string | JID completo do remetente | `"5511999999999@s.whatsapp.net"` |
| `text` | string | Texto da mensagem recebida | `"Olá, preciso de ajuda"` |
| `timestamp` | number | Timestamp em milissegundos | `1769221827000` |
| `pushName` | string \| null | Nome do contato (se disponível) | `"João Silva"` ou `null` |
| `messageId` | string | ID único da mensagem no WhatsApp | `"3EB0ABCD1234"` |
| `isGroup` | boolean | Se a mensagem veio de um grupo | `false` (individual) ou `true` (grupo) |
| `messageType` | string | Tipo da mensagem | `"conversation"`, `"extendedText"`, ou `"other"` |
| `deviceType` | string | Tipo de dispositivo/origem | `"whatsapp"` |

---

## 🔄 Fluxo Completo

```
1. Usuário envia mensagem no WhatsApp
   ↓
2. TH_BRIDGE recebe a mensagem
   ↓
3. TH_BRIDGE prepara JSON:
   {
     "from": "5511999999999@s.whatsapp.net",
     "text": "Mensagem do usuário",
     ...
   }
   ↓
4. TH_BRIDGE faz POST para TH_BRAIN:
   POST http://localhost:3001/api/process
   Body: { JSON acima }
   ↓
5. TH_BRAIN processa regras de negócio
   ↓
6. TH_BRAIN retorna resposta:
   {
     "shouldReply": true,
     "message": "Resposta processada"
   }
   ↓
7. TH_BRIDGE recebe resposta
   ↓
8. TH_BRIDGE envia resposta para WhatsApp
```

---

## 📥 Resposta Esperada do TH_BRAIN

O TH_BRAIN deve retornar um JSON neste formato:

```json
{
  "shouldReply": true,
  "message": "Resposta processada pelas regras de negócio do TH_BRAIN"
}
```

**Campos:**
- `shouldReply` (boolean): Se `true`, o TH_BRIDGE envia a resposta. Se `false`, não envia nada.
- `message` (string): Texto da resposta a ser enviada (obrigatório se `shouldReply` for `true`)

**Exemplo de resposta opcional (com metadata):**

```json
{
  "shouldReply": true,
  "message": "Resposta processada",
  "metadata": {
    "intent": "help",
    "confidence": 0.95,
    "processedAt": "2025-01-15T10:30:27.000Z"
  }
}
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Mensagem Individual

**Mensagem recebida:**
```
Usuário: "Olá, preciso de ajuda"
```

**JSON enviado para TH_BRAIN:**
```json
{
  "from": "5511999999999@s.whatsapp.net",
  "text": "Olá, preciso de ajuda",
  "timestamp": 1769221827000,
  "pushName": "João Silva",
  "messageId": "3EB0ABCD1234",
  "isGroup": false,
  "messageType": "conversation",
  "deviceType": "whatsapp"
}
```

**Resposta do TH_BRAIN:**
```json
{
  "shouldReply": true,
  "message": "Olá João! Como posso ajudá-lo hoje?"
}
```

**Resultado:** TH_BRIDGE envia "Olá João! Como posso ajudá-lo hoje?" para o WhatsApp

---

### Exemplo 2: Mensagem de Grupo

**JSON enviado para TH_BRAIN:**
```json
{
  "from": "5511999999999@g.us",
  "text": "Mensagem no grupo",
  "timestamp": 1769221827000,
  "pushName": null,
  "messageId": "3EB0ABCD5678",
  "isGroup": true,
  "messageType": "conversation",
  "deviceType": "whatsapp"
}
```

---

### Exemplo 3: TH_BRAIN não quer responder

**Resposta do TH_BRAIN:**
```json
{
  "shouldReply": false
}
```

**Resultado:** TH_BRIDGE não envia nenhuma mensagem

---

## ⚙️ Configuração

A URL do TH_BRAIN pode ser configurada via variável de ambiente:

```bash
# Windows PowerShell
$env:TH_BRAIN_URL="http://localhost:3001"
node th-bridge.js

# Linux/Mac
TH_BRAIN_URL=http://localhost:3001 node th-bridge.js
```

**Padrão:** `http://localhost:3001` (se não configurado)

---

## ⚠️ Tratamento de Erros

Se o TH_BRAIN não estiver disponível ou retornar erro:

- O TH_BRIDGE loga o erro no console
- **Não envia mensagem de erro** para o usuário (comportamento silencioso)
- Você pode descomentar o código para enviar mensagem de erro genérica se necessário

---

## 🔍 Logs no Console

Quando uma mensagem é processada, você verá:

```
📨 Mensagem recebida de 5511999999999@s.whatsapp.net: Olá, preciso de ajuda
🧠 Enviando mensagem para TH_BRAIN: http://localhost:3001/api/process
📤 JSON enviado: {
  "from": "5511999999999@s.whatsapp.net",
  "text": "Olá, preciso de ajuda",
  ...
}
✅ Resposta recebida do TH_BRAIN: {
  "shouldReply": true,
  "message": "Olá João! Como posso ajudá-lo hoje?"
}
📤 Enviando resposta do TH_BRAIN para 5511999999999@s.whatsapp.net...
✅ Resposta enviada com sucesso!
```

---

**Última atualização:** 2025-01-15


