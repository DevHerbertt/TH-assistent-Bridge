# TH Bridge — Assistente TH no WhatsApp

[![Node.js](https://img.shields.io/badge/Node.js-18.x%2B-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](./README.md)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)

Sistema de ponte (bridge) em Node.js que conecta o WhatsApp ao backend **TH-brain** (Spring Boot), permitindo que a assistente TH converse com usuários em tempo real via WhatsApp, com debounce, indicador de digitação e API HTTP para integração externa.

---

## 📋 Índice

- [Visão geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API HTTP](#-api-http)
- [Integração TH-brain](#-integração-th-brain)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Segurança e privacidade](#-segurança-e-privacidade)
- [Solução de problemas](#-solução-de-problemas)
- [Referências](#-referências)

---

## 📋 Visão geral

O **TH Bridge** é o componente que fica entre o **WhatsApp** (via biblioteca [Baileys](https://github.com/WhiskeySockets/Baileys)) e o backend **TH-brain**. Ele:

- Mantém uma sessão WhatsApp vinculada como dispositivo (ex.: *"Assistente th"*).
- Recebe mensagens em tempo real, acumula em buffer por usuário (debounce de 6 s) e envia um único lote ao TH-brain para evitar respostas fragmentadas.
- Envia ao usuário apenas a resposta quando o TH-brain retorna conteúdo (200); em 204 ou erro, não envia mensagem (ou fallback em caso de indisponibilidade).
- Oferece API HTTP para health check e envio programático de mensagens.
- Exibe indicador de “digitando…” antes de enviar a resposta da TH, para experiência mais natural.

O repositório contém **apenas** o bridge; credenciais de WhatsApp (`auth_th`) e módulos sensíveis não são versionados.

---

## 🔧 Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| **Conexão WhatsApp** | Sessão persistente via Baileys; reconexão automática. |
| **Integração TH-brain** | POST para `TH_BRAIN_URL/api/v1/brain/process` com payload no formato User (text ou messages). |
| **Debounce** | Buffer de 6 s por remetente; envio único com `text` (1 msg) ou `messages` (várias). |
| **Resposta condicional** | Só envia mensagem ao usuário se o brain retornar 200 com `response`; 204 = sem resposta. |
| **Indicador de digitação** | Presença “digitando” antes de enviar a resposta; tempo proporcional ao tamanho do texto. |
| **API HTTP** | `GET /health`, `POST /send-message` para integração externa. |
| **Filtro de mensagens** | Ignora mensagens próprias (`fromMe`), sem texto (mídia/figurinha) e append antiga (>5 min). |
| **Estado de conversa** | `conversationActivate` por remetente; “tchau th” / “exit” desativam. |

---

## 🏗️ Arquitetura

```
┌─────────────────┐     mensagens      ┌──────────────┐     POST /api/v1/brain/process     ┌─────────────┐
│   WhatsApp      │ ◄────────────────► │  TH Bridge   │ ◄─────────────────────────────────► │  TH-brain    │
│   (usuários)    │     respostas      │  (Node.js)   │     text / messages + User         │  (Spring)   │
└─────────────────┘                    └──────────────┘                                    └─────────────┘
                                        │
                                        │ GET /health
                                        │ POST /send-message
                                        ▼
                               ┌─────────────────┐
                               │  Clientes HTTP  │
                               │  (monitoração)  │
                               └─────────────────┘
```

- **Fluxo de mensagem:** WhatsApp → Bridge (buffer por usuário) → após 6 s sem nova mensagem → uma requisição ao TH-brain com `text` ou `messages` → se 200 com `response`, bridge envia “digitando” e depois o texto ao usuário.
- **Variáveis de ambiente:** `PORT` (API), `TH_BRAIN_URL` (base do backend).

---

## 📦 Pré-requisitos

- **Node.js** 18.x ou superior.
- **npm** (ou yarn/pnpm).
- **TH-brain** rodando e acessível (ex.: `http://localhost:8080`) para processar mensagens.
- Conta WhatsApp para vincular como dispositivo (QR Code na primeira execução).

---

## 🚀 Instalação

1. **Clone o repositório** (ou baixe o código):

   ```bash
   git clone https://github.com/DevHerbertt/TH-assistent-Bridge.git
   cd TH-assistent-Bridge
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **(Opcional)** Configure variáveis de ambiente (veja [Configuração](#-configuração)).

4. **Inicie o bridge:**

   ```bash
   npm start
   ```

   Ou diretamente:

   ```bash
   node th-bridge.js
   ```

5. **Primeira execução:** um QR Code será exibido no terminal. Abra o WhatsApp no celular → **Dispositivos vinculados** → **Vincular dispositivo** e escaneie o QR. A sessão fica salva em `auth_th` (não versionada).

---

## ⚙️ Configuração

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor HTTP (API) | `3000` |
| `TH_BRAIN_URL` | URL base do backend TH-brain | `http://localhost:8080` |

Exemplo em ambiente Unix (bash):

```bash
export PORT=3000
export TH_BRAIN_URL=http://localhost:8080
npm start
```

No Windows (PowerShell):

```powershell
$env:PORT=3000
$env:TH_BRAIN_URL="http://localhost:8080"
npm start
```

O endpoint usado pelo bridge é: `{TH_BRAIN_URL}/api/v1/brain/process`.

---

## 🎯 Uso

### Subir o bridge

```bash
npm start
```

Verifique no terminal: `✅ th ONLINE!` e a URL da API (ex.: `http://localhost:3000`). No celular, o dispositivo vinculado aparecerá como *"Assistente th"*.

### Deslogar / nova sessão

Para evitar histórico antigo ao reconectar ou trocar de conta:

- **Pelo computador:** apague a pasta `auth_th` na raiz do projeto e rode `npm start` novamente; um novo QR Code será exibido.
- **Pelo celular:** WhatsApp → **Dispositivos vinculados** → *"Assistente th"* → **Desvincular**. Na próxima execução do bridge, escaneie o QR novamente.

### Comportamento das mensagens

- Mensagens **com texto** são acumuladas por remetente; após **6 segundos** sem nova mensagem, o lote é enviado ao TH-brain em uma única requisição (`text` ou `messages`).
- O bridge **só envia resposta** ao usuário quando o TH-brain retorna **200** com campo `response`. Em **204** (sem resposta) nada é enviado; em erro de rede/5xx pode ser enviada mensagem de fallback.
- Mensagens sem texto (figurinha, áudio sem legenda, etc.) são ignoradas e não são enviadas ao brain.

---

## 📡 API HTTP

A API roda na porta configurada por `PORT` (padrão 3000).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Status do serviço e da conexão WhatsApp (`whatsappConnected`: true/false). |
| `POST` | `/send-message` | Envia uma mensagem via WhatsApp. Body: `{ "to": "5511999999999", "message": "Texto" }`. |
| `POST` | `/webhook/message` | Webhook de notificações (resposta fixa de confirmação). |

Exemplo de health check:

```bash
curl http://localhost:3000/health
```

Resposta esperada (exemplo):

```json
{
  "status": "ok",
  "whatsappConnected": true,
  "timestamp": "2026-02-21T12:00:00.000Z"
}
```

Documentação detalhada da API está em [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

---

## 🧠 Integração TH-brain

### Contrato do backend

- **URL:** `POST {TH_BRAIN_URL}/api/v1/brain/process`
- **Content-Type:** `application/json`
- **Corpo (modelo User):**  
  - `text` (uma mensagem) **ou** `messages` (array de strings).  
  - Obrigatórios: `from`, `timeStamp`, `conversationActivate`, `name`, `menssageId`, `isgroup`, `messageType`, `deviceType`.

### Respostas

- **200 OK** com JSON `AiResponse`: campo `response` contém o texto a ser enviado ao usuário; o bridge envia esse texto no WhatsApp (com indicador de digitação).
- **204 No Content:** o bridge não envia nenhuma mensagem ao usuário.
- **Erro (rede / 5xx):** o bridge pode enviar mensagem de fallback (ex.: *"TH temporariamente indisponível"*) e registra o erro em log.

Detalhes do payload e exemplos estão em [JSON_ENVIADO_TH_BRAIN.md](./JSON_ENVIADO_TH_BRAIN.md) (ajuste a URL/endpoint para `/api/v1/brain/process` conforme seu backend).

---

## 📁 Estrutura do projeto

```
TH-assistent-Bridge/
├── th-bridge.js              # Aplicação principal (WhatsApp + API + TH-brain)
├── package.json              # Dependências e scripts
├── README.md                 # Este arquivo
├── API_DOCUMENTATION.md      # Documentação da API HTTP
├── ESTRUTURA.md              # Documentação da estrutura (se existir)
├── JSON_ENVIADO_TH_BRAIN.md  # Exemplo de payload para o TH-brain
├── EXEMPLO_JSON_RETORNO.md   # Exemplo de resposta do TH-brain
├── .gitignore                # Exclusões (auth_th, Th-cobrador, .env, etc.)
└── auth_th/                  # Sessão WhatsApp (local, NUNCA versionar)
```

- **`auth_th/`** é gerada na primeira execução e não deve ser commitada.
- Módulos como **Th-cobrador** não fazem parte deste repositório; o `.gitignore` garante que não sejam incluídos.

---

## 🔒 Segurança e privacidade

- **Credenciais WhatsApp:** armazenadas apenas na pasta `auth_th` no ambiente local. Nunca inclua `auth_th` em repositórios ou backups públicos.
- **Variáveis sensíveis:** use `.env` para URLs ou tokens se necessário; `.env` está no `.gitignore`.
- **API:** os endpoints atuais não exigem autenticação; em produção, considere rede privada, proxy reverso ou middleware de autenticação.
- **Dados de mensagens:** trafegam entre o bridge e o TH-brain; garanta que o TH-brain e a rede estejam adequados às suas políticas de privacidade e LGPD.

---

## 🆘 Solução de problemas

| Situação | Ação sugerida |
|----------|----------------|
| QR Code não aparece | Verifique se a pasta `auth_th` existe e se não está corrompida; tente removê-la e rodar de novo. |
| Bridge não envia resposta ao usuário | Confirme se o TH-brain está acessível em `TH_BRAIN_URL` e se retorna 200 com `response`. Veja os logs do bridge. |
| Muitas mensagens antigas ao conectar | Faça desvinculação pelo celular ou apague `auth_th` e vincule de novo para reduzir histórico. |
| “TH temporariamente indisponível” | Indica falha de comunicação com o TH-brain (timeout, 5xx, rede). Verifique URL, firewall e logs do backend. |

Logs no terminal indicam: evento de mensagem (NOTIFY), buffer por usuário, envio ao brain e resposta enviada ou 204.

---

## 📚 Referências

- [Baileys (WhatsApp Web API)](https://github.com/WhiskeySockets/Baileys)
- [Express](https://expressjs.com/)
- [Node.js](https://nodejs.org/)

---

**TH Bridge** — Sistema principal de conexão WhatsApp para a assistente TH.  
Mantido no repositório [TH-assistent-Bridge](https://github.com/DevHerbertt/TH-assistent-Bridge).
