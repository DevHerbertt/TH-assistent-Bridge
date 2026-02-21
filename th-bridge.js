const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const express = require('express');
const http = require('http');
const https = require('https');

// Variável global para o socket do WhatsApp
let whatsappSocket = null;
let isConnected = false;

// Configuração do servidor Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do TH-brain (Spring Boot)
const TH_BRAIN_URL = process.env.TH_BRAIN_URL || 'http://localhost:8080';
const TH_BRAIN_ENDPOINT = `${TH_BRAIN_URL}/api/v1/brain/process`;

// Estado de conversa por remetente (conversationActivate) para o TH-brain
const conversationStateByFrom = new Map();

// Debounce: buffer por usuário (from), timer 6s — evita responder a cada mensagem e envia contexto completo
const DEBOUNCE_MS = 6000;
const MENSAGEM_FALLBACK_INDISPONIVEL = 'TH temporariamente indisponível. Tente novamente em instantes.';
/** @type {Map<string, { texts: string[], timer: NodeJS.Timeout | null, lastMeta: { name?: string, messageType: string, menssageId: string } }>} */
const debounceByFrom = new Map();

// Middleware para parsing JSON
app.use(express.json());

// Middleware de CORS (para permitir requisições do TH_BRAIN)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsappConnected: isConnected,
        timestamp: new Date().toISOString()
    });
});

// Endpoint principal: Enviar mensagem via WhatsApp
app.post('/send-message', async (req, res) => {
    try {
        // Validar se WhatsApp está conectado
        if (!isConnected || !whatsappSocket) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp não está conectado',
                message: 'Aguarde a conexão ser estabelecida',
                timestamp: new Date().toISOString()
            });
        }

        // Validar dados recebidos
        const { to, message } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Campo "to" é obrigatório',
                message: 'Forneça o número de telefone ou JID do destinatário',
                timestamp: new Date().toISOString()
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Campo "message" é obrigatório',
                message: 'Forneça a mensagem a ser enviada',
                timestamp: new Date().toISOString()
            });
        }

        // Normalizar número de telefone (adicionar @s.whatsapp.net se necessário)
        let jid = to;
        if (!jid.includes('@')) {
            // Remove caracteres não numéricos
            const numeroLimpo = jid.replace(/\D/g, '');
            if (numeroLimpo.length >= 10) {
                // Se não começar com código do país, adiciona 55 (Brasil)
                const numeroCompleto = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
                jid = `${numeroCompleto}@s.whatsapp.net`;
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Número de telefone inválido',
                    message: 'O número deve ter pelo menos 10 dígitos',
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Enviar mensagem via WhatsApp
        console.log(`📤 Enviando mensagem para ${jid}...`);
        const messageResult = await whatsappSocket.sendMessage(jid, { 
            text: message 
        });

        // Extrair informações da mensagem enviada
        const messageId = messageResult?.key?.id || null;
        const timestamp = Date.now();

        // Resposta de sucesso
        const response = {
            success: true,
            data: {
                messageId: messageId,
                to: jid,
                message: message,
                timestamp: timestamp,
                sentAt: new Date(timestamp).toISOString()
            },
            timestamp: new Date().toISOString()
        };

        console.log(`✅ Mensagem enviada com sucesso! ID: ${messageId}`);
        
        res.status(200).json(response);

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro ao enviar mensagem',
            message: error.message,
            details: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para receber mensagens do WhatsApp e enviar para TH_BRAIN (webhook)
// Este endpoint pode ser usado para notificar o TH_BRAIN sobre mensagens recebidas
app.post('/webhook/message', (req, res) => {
    // Este endpoint é para o TH_BRAIN receber notificações
    // Por enquanto apenas confirma recebimento
    res.json({
        success: true,
        message: 'Webhook recebido',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor HTTP
app.listen(PORT, () => {
    console.log(`\n🌐 Servidor HTTP iniciado na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET  /health - Status da conexão`);
    console.log(`   POST /send-message - Enviar mensagem via WhatsApp`);
    console.log(`   POST /webhook/message - Webhook para notificações`);
    console.log(`\n💡 TH-brain URL: ${TH_BRAIN_URL} | Endpoint: ${TH_BRAIN_ENDPOINT}\n`);
});

/** Mapeia mensagem Baileys para texto e messageType do contrato TH-brain */
function extrairTextoETipoMensagem(message) {
    if (!message) return { text: '', messageType: 'other' };
    if (message.conversation) {
        return { text: message.conversation, messageType: 'conversation' };
    }
    if (message.extendedTextMessage) {
        return {
            text: message.extendedTextMessage.text || '',
            messageType: 'extendedText'
        };
    }
    if (message.imageMessage) {
        return {
            text: message.imageMessage.caption || '',
            messageType: 'imageMessage'
        };
    }
    if (message.videoMessage) {
        return {
            text: message.videoMessage.caption || '',
            messageType: 'videoMessage'
        };
    }
    if (message.audioMessage) {
        return { text: '', messageType: 'audioMessage' };
    }
    if (message.documentMessage) {
        return { text: message.documentMessage.caption || message.documentMessage.fileName || '', messageType: 'documentMessage' };
    }
    if (message.stickerMessage) {
        return { text: '', messageType: 'stickerMessage' };
    }
    return { text: '', messageType: 'other' };
}

/** POST para TH-brain; retorna { statusCode, body } (body só em 200 com JSON). Em erro de rede/timeout rejeita a Promise. */
function postThBrain(payload) {
    return new Promise((resolve, reject) => {
        const url = new URL(TH_BRAIN_ENDPOINT);
        const postData = JSON.stringify(payload);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + (url.search || ''),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 30000
        };

        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 204) {
                    return resolve({ statusCode: 204, body: null });
                }
                if (res.statusCode === 200 && data) {
                    try {
                        return resolve({ statusCode: 200, body: JSON.parse(data) });
                    } catch (e) {
                        return reject(new Error(`Resposta 200 com JSON inválido: ${e.message}`));
                    }
                }
                if (res.statusCode >= 500) {
                    return reject(new Error(`TH-brain erro ${res.statusCode}: ${data}`));
                }
                resolve({ statusCode: res.statusCode, body: data ? (() => { try { return JSON.parse(data); } catch (_) { return null; } })() : null });
            });
        });

        req.on('error', (err) => reject(new Error(`Erro de conexão com TH-brain: ${err.message}`)));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout de 30s ao comunicar com TH-brain'));
        });

        req.write(postData);
        req.end();
    });
}

async function startTh() {
    // IMPORTANTE: 'auth_th' é a pasta onde ficará o seu login. 
    // Se quiser mudar o nome do aparelho depois, apague essa pasta e rode de novo.
    const { state, saveCreds } = await useMultiFileAuthState('auth_th');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        // Configuração da Identidade do Dispositivo
        browser: ['Assistente th', 'Chrome', '115.0.0']
    });

    // Armazenar socket globalmente para uso nos endpoints
    whatsappSocket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
      // Se o sistema gerar um QR Code, desenha ele no terminal
        if (qr) {
            console.log('--- ESCANEIE O QR CODE ABAIXO ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) startTh();
        } else if (connection === 'open') {
            isConnected = true;
            console.log('\n✅ th ONLINE!');
            console.log('Verifique no seu celular: o nome do aparelho deve ser "Assistente th"');
            console.log(`🌐 API HTTP disponível em http://localhost:${PORT}`);
        }
    });

    // Escutando mensagens recebidas
    // notify = em tempo real; append = histórico ou mensagem recente (após reconectar)
    const IDADE_MAXIMA_MS = 5 * 60 * 1000; // 5 minutos: append mais antiga é ignorada (janela maior para não perder mensagens novas)
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg) return;

        if (m.type === 'notify') {
            console.log(`\n📥 [NOTIFY] mensagem em tempo real | de=${msg.key?.remoteJid || '?'} | fromMe=${!!msg.key?.fromMe} | temConteudo=${!!msg.message}`);
        }

        if (!msg.message) return;
        if (msg.key.fromMe) return;

        if (m.type === 'append') {
            const ts = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : 0;
            if (Date.now() - ts > IDADE_MAXIMA_MS) return; // append antiga: ignora sem logar
        } else if (m.type !== 'notify') return;

        const remoteJid = msg.key.remoteJid;
        const { text: messageText, messageType } = extrairTextoETipoMensagem(msg.message);

        if (!(messageText || '').trim()) {
            console.log(`\n📥 Mensagem ignorada (sem texto) | de=${remoteJid} | tipo=${messageType} | mídia/figurinha/etc.`);
            return;
        }

        console.log(`\n📥 Mensagem recebida | de=${remoteJid} | tipo=${messageType} | texto="${(messageText || '').slice(0, 80)}${(messageText && messageText.length > 80) ? '...' : ''}"`);

        const textoLower = (messageText || '').trim().toLowerCase();
        if (textoLower === 'tchau th' || textoLower === 'exit') {
            conversationStateByFrom.set(remoteJid, false);
        }

        // Debounce: guardar no buffer e agendar envio único ao brain (só envia após 2.5s sem nova mensagem)
        if (!debounceByFrom.has(remoteJid)) {
            debounceByFrom.set(remoteJid, { texts: [], timer: null, lastMeta: {} });
        }
        const entry = debounceByFrom.get(remoteJid);
        entry.texts.push((messageText || '').trim());
        entry.lastMeta = { name: msg.pushName || null, messageType, menssageId: msg.key.id };

        const totalNoBuffer = entry.texts.length;
        if (entry.timer) clearTimeout(entry.timer);
        entry.timer = setTimeout(() => {
            entry.timer = null;
            const textos = [...entry.texts];
            debounceByFrom.delete(remoteJid);
            enviarBufferParaBrain(sock, remoteJid, textos, entry.lastMeta);
        }, DEBOUNCE_MS);
        console.log(`   📋 Buffer: ${totalNoBuffer} mensagem(ns) para este usuário — enviando ao brain em ${DEBOUNCE_MS / 1000}s se não chegar mais nenhuma`);
    });
}

/** Envia um lote de mensagens (buffer) ao TH-brain uma vez e envia a resposta ao usuário. */
async function enviarBufferParaBrain(sock, remoteJid, textos, lastMeta) {
    if (!textos || textos.length === 0) return;
    const conversationActivate = conversationStateByFrom.get(remoteJid) ?? false;
    const isgroup = remoteJid.includes('@g.us');

    const userPayload = {
        conversationActivate,
        from: remoteJid,
        timeStamp: Date.now(),
        name: lastMeta.name ?? null,
        menssageId: lastMeta.menssageId,
        isgroup,
        messageType: lastMeta.messageType || 'conversation',
        deviceType: 'android'
    };

    if (textos.length === 1) {
        userPayload.text = textos[0];
    } else {
        userPayload.messages = textos;
    }

    try {
        console.log(`🧠 Enviando para TH-brain (${textos.length} msg) | ${TH_BRAIN_ENDPOINT}`);

        const { statusCode, body: responseBody } = await postThBrain(userPayload);

        if (statusCode === 204) {
            console.log(`ℹ️  TH-brain retornou 204 (sem resposta). Não enviando mensagem ao usuário.`);
            return;
        }

        if (statusCode === 200 && responseBody) {
            const responseText = responseBody.response;
            if (responseBody.isSucess && responseText) {
                conversationStateByFrom.set(remoteJid, true);
                console.log(`📤 Enviando resposta do TH para ${remoteJid}...`);
                try {
                    await sock.sendPresenceUpdate('composing', remoteJid);
                    const tempoDigitandoMs = Math.min(4000, 1000 + responseText.length * 25);
                    await new Promise(r => setTimeout(r, tempoDigitandoMs));
                    await sock.sendMessage(remoteJid, { text: responseText });
                    await sock.sendPresenceUpdate('paused', remoteJid);
                } catch (presenceErr) {
                    await sock.sendMessage(remoteJid, { text: responseText });
                }
                console.log(`✅ Resposta enviada.`);
            } else {
                console.log(`ℹ️  TH-brain não retornou texto (isSucess: ${responseBody.isSucess}).`);
            }
            return;
        }

        console.warn(`TH-brain retornou status inesperado: ${statusCode}. Não enviando resposta.`);

    } catch (error) {
        console.error(`❌ Erro ao comunicar com TH-brain:`, error.message);
        console.error(`   Endpoint: ${TH_BRAIN_ENDPOINT}`);
        try {
            await sock.sendMessage(remoteJid, { text: MENSAGEM_FALLBACK_INDISPONIVEL });
        } catch (envioErr) {
            console.error(`   Falha ao enviar mensagem de fallback:`, envioErr.message);
        }
    }
}

startTh();