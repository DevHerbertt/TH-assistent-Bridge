# 📁 Estrutura do Projeto TH Bridge

## 🎯 Organização

Este projeto está organizado com o **TH Bridge como sistema principal** e módulos isolados.

```
TH-bridge/
│
├── 📄 th-bridge.js          ⭐ SISTEMA PRINCIPAL
├── 📄 package.json          Configuração do projeto
├── 📄 README.md             Documentação principal
│
├── 📁 auth_th/              Autenticação compartilhada
│   └── [arquivos de auth]   Usado por bridge e módulos
│
└── 📁 Th-cobrador/          🔒 MÓDULO ISOLADO
    ├── 📄 cobrador.js       Sistema de cobrança (independente)
    ├── 📄 README.md         Documentação do módulo
    ├── 📄 ISOLADO.md        Informações sobre isolamento
    ├── 📄 COMO_USAR.md      Guia de uso
    └── 📄 cobrancas.json    Arquivo de dados
```

## ⭐ Sistema Principal

### `th-bridge.js`
- **Função**: Conexão base com WhatsApp
- **Status**: Sistema principal do projeto
- **Execução**: `npm start` ou `node th-bridge.js`
- **Autenticação**: `auth_th/` (raiz)

## 🔒 Módulos Isolados

### `Th-cobrador/`
- **Função**: Sistema de cobrança automatizada
- **Status**: Módulo isolado e independente
- **Execução**: `npm run cobrador` ou `node Th-cobrador/cobrador.js`
- **Autenticação**: Compartilha `../auth_th/` (raiz)
- **Isolamento**: Código completamente separado

## 🔗 Compartilhamento

### O que é compartilhado:
- ✅ Autenticação (`auth_th/`)
- ✅ Dependências (`node_modules/`)
- ✅ Estrutura base do projeto

### O que é isolado:
- ❌ Código fonte
- ❌ Lógica de negócio
- ❌ Configurações específicas
- ❌ Documentação

## 📝 Regras de Isolamento

1. **Módulos não dependem do bridge principal**
   - Cada módulo pode funcionar independentemente
   - O bridge pode funcionar sem os módulos

2. **Autenticação compartilhada**
   - Todos usam a mesma `auth_th/` da raiz
   - Evita múltiplas autenticações

3. **Documentação separada**
   - Cada módulo tem seu próprio README
   - Documentação principal na raiz

## 🚀 Comandos Disponíveis

```bash
# Sistema principal
npm start                    # Executa th-bridge.js

# Módulo isolado
npm run cobrador             # Executa Th-cobrador/cobrador.js
```

## ➕ Adicionar Novos Módulos

Para adicionar um novo módulo isolado:

1. Criar pasta: `Th-[nome-modulo]/`
2. Criar código independente
3. Usar autenticação: `../auth_th/`
4. Adicionar script no `package.json`:
   ```json
   "scripts": {
     "[nome]": "node Th-[nome-modulo]/[arquivo].js"
   }
   ```
5. Criar README próprio no módulo

---

**Estrutura mantida para facilitar manutenção e isolamento de funcionalidades**


