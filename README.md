# TH Bridge

Sistema principal de conexão WhatsApp usando Baileys.

## 📋 Descrição

Este é o sistema principal (bridge) que estabelece a conexão com o WhatsApp usando a biblioteca Baileys. Ele serve como base para outros módulos do projeto.

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Executar o Bridge Principal

```bash
npm start
```

Ou diretamente:

```bash
node th-bridge.js
```

### Autenticação

Na primeira execução, você precisará escanear o QR Code exibido no terminal com seu WhatsApp.

**Importante:** A autenticação fica salva na pasta `auth_th`. Se você apagar essa pasta, precisará escanear o QR Code novamente.

### Como deslogar (nova sessão / parar de receber histórico antigo)

Para começar uma sessão nova e evitar enxurrada de mensagens antigas ao conectar:

1. **Pelo computador:** apague a pasta `auth_th` na raiz do projeto. Na próxima vez que rodar `npm start`, um novo QR Code aparecerá e você vincula de novo.
2. **Pelo celular:** WhatsApp → **Dispositivos vinculados** → encontre **"Assistente th"** → **Desvincular**. Depois, ao subir o bridge de novo, escaneie o QR Code como na primeira vez.

## 📁 Estrutura do Projeto

```
TH-bridge/
├── th-bridge.js          # ⭐ Sistema principal (bridge)
├── auth_th/              # Autenticação compartilhada (usada por todos)
├── Th-cobrador/          # 🔒 Módulo isolado de cobrança
│   ├── cobrador.js       # Sistema de cobrança (independente)
│   └── ...               # Documentação e arquivos do módulo
├── package.json
├── README.md             # Este arquivo
└── ESTRUTURA.md          # Documentação da estrutura
```

## 🔧 Funcionalidades

- Conexão com WhatsApp via Baileys
- Autenticação persistente
- Reconexão automática
- Resposta automática a mensagens (exemplo: "th")

## 📝 Notas

- O sistema usa a identidade "Assistente th" no WhatsApp
- A autenticação é compartilhada entre módulos (pasta `auth_th` na raiz)
- Este é o sistema base - outros módulos podem ser adicionados separadamente
- Módulos isolados não dependem do código do bridge principal

## 🔗 Módulos Relacionados

- **Th-cobrador**: Sistema de cobrança automatizada (módulo isolado)
  - Execute com: `npm run cobrador` ou `node Th-cobrador/cobrador.js`

## 📚 Dependências

- `@whiskeysockets/baileys` - Biblioteca para conexão com WhatsApp
- `pino` - Logger
- `qrcode-terminal` - Exibição de QR Code no terminal

## 🔒 Segurança

- As credenciais de autenticação são armazenadas localmente na pasta `auth_th`
- Nunca compartilhe a pasta `auth_th` com outras pessoas
- Mantenha o código e as credenciais seguras

---

**Sistema Principal - TH Bridge**

