import express from "express";
import path from "path";
import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";
import twilio from "twilio";
import webPush from "web-push";

// Configurações do Web Push (VAPID)
// Você deve gerar essas chaves usando: npx web-push generate-vapid-keys
// E salvá-las no seu .env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BE_2bKQd-_sjqirzqxUyWDUzGXUMpsYdJAykxDmVySDs1wIfhDxZ7ngCaHFaZQslDjOHb3-vmechAxxMeqplwQE'; 
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'UGwEUtPz5_FqSPgPE4rPQ-Ep-x1AuHtVg92a3UMyIC4';

webPush.setVapidDetails(
  'mailto:viciowins@gmail.com',
  publicVapidKey,
  privateVapidKey
);
import { startEmailCronJob, sendEmail } from "./emailService.ts";
import { GoogleGenAI } from '@google/genai';

dotenv.config({ override: true });

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

try {
  if (fs.existsSync('./firebase-applet-config.json')) {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.projectId, // Fallback if missing in cert
          });
          console.log("Firebase Admin initialized WITH Service Account (Full Admin Privileges)");
        } catch (parseError) {
          console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", parseError);
          // Fallback to basic initialization
          admin.initializeApp({ projectId: config.projectId });
          console.log("Firebase Admin initialized (Basic Mode - Parse Error)");
        }
      } else {
        admin.initializeApp({
          projectId: config.projectId,
        });
        console.log("Firebase Admin initialized (Basic Mode - No Service Account found)");
      }
    }
    
    // Inicia o job de e-mails apenas se o Firebase Admin inicializar com sucesso
    startEmailCronJob();
  }
} catch (e) {
  console.error("Firebase Admin init error", e);
}

// Twilio Client Setup
let twilioClient: twilio.Twilio | null = null;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
  if(TWILIO_ACCOUNT_SID.startsWith('AC')) { twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); } else { console.warn('Twilio init skipped: TWILIO_ACCOUNT_SID must start with AC'); }
  } catch (e) {
    console.warn("Twilio init warning:", e);
  }
}

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const PORT = 3000;

  app.use(express.json());

  // Permitir que o site seja embutido via iframe
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://*.alertacriminal.com.br http://*.alertacriminal.com.br alertacriminal.com.br https://alerta-criminal-c1612.web.app https://alerta-criminal-c1612.firebaseapp.com"
    );
    res.removeHeader('X-Frame-Options');
    next();
  });

  // --------------------------------------------------------------------------
  // 🔥 FIREBASE AUTH MIDDLEWARE (SECURITY SHIELD)
  // --------------------------------------------------------------------------
  const verifyFirebaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autorizado. Token ausente ou inválido." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      // Verifica o token no Google Identity/Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      // Injeta os dados do usuário autenticado na requisição para as próximas rotas usarem
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      fs.appendFileSync("server.log", "Token error: " + error.message + "\n"); console.error("Token de autenticação inválido ou expirado:", error);
      return res.status(403).json({ error: "Acesso negado. Sessão inválida ou expirada." });
    }
  };

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 🔒 Rota Protegida (Guardião Virtual)
  app.post("/api/chat", verifyFirebaseToken, async (req, res) => {
    try {
      const { messages } = req.body;
      
      const contents = messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: "Você é o Guardião Virtual, um assistente especializado em segurança pública e pessoal no Brasil. Dê dicas práticas, curtas e diretas sobre como evitar assaltos, rotas seguras, e o que fazer em emergências. Enfatize também a 'Zeladoria e Risco' (teoria das janelas quebradas): encoraje os usuários a reportar mato alto, falta de iluminação, buracos e enchentes, pois ambientes mal cuidados atraem o crime e geram acidentes. Seja empático, calmo e prestativo. Nunca recomende reagir a assaltos.",
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Erro no chat:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 🔒 Rota Protegida
  app.get("/api/test-admin", verifyFirebaseToken, async (req, res) => {
    try {
      const db = admin.firestore();
      const usersSnap = await db.collection('users').limit(1).get();
      res.json({ success: true, count: usersSnap.size });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 🔒 Rota Protegida
  app.post("/api/test-email", verifyFirebaseToken, async (req, res) => {
    const { to, name } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, error: "E-mail de destino (to) é obrigatório." });
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Teste de E-mail - Alerta Criminal</h2>
        <p>Olá <strong>${name || 'Usuário'}</strong>,</p>
        <p>Este é um e-mail de teste para confirmar que a configuração do servidor SMTP está funcionando perfeitamente.</p>
        <br/>
        <p style="color: #64748b; font-size: 14px;">Equipe Alerta Criminal</p>
      </div>
    `;

    const success = await sendEmail(to, 'Teste de Configuração de E-mail', htmlContent);
    
    if (success) {
      res.json({ success: true, message: "E-mail enviado com sucesso!" });
    } else {
      res.status(500).json({ success: false, error: "Falha ao enviar e-mail. Verifique os logs do servidor e as credenciais SMTP." });
    }
  });

  // --------------------------------------------------------------------------
  // 🔥 PUSH NOTIFICATIONS API
  // --------------------------------------------------------------------------
  
  // Endpoint to save a push subscription
  app.post('/api/push/subscribe', verifyFirebaseToken, async (req, res) => {
    try {
      const subscription = req.body;
      const uid = (req as any).user.uid;

      console.log(`Nova inscrição de Push recebida para o usuário: ${uid}`);
      
      const db = admin.firestore();
      await db.collection('users').doc(uid).collection('pushSubscriptions').add(subscription);

      res.status(201).json({ message: 'Inscrição realizada com sucesso' });
    } catch (error) {
      console.error('Erro ao salvar inscrição push:', error);
      res.status(500).json({ error: 'Falha ao salvar inscrição' });
    }
  });

  // Endpoint to broadcast a push notification
  app.post('/api/push/broadcast', verifyFirebaseToken, async (req, res) => {
    try {
      const { title, body, url, htmlContent } = req.body;
      const uid = (req as any).user.uid;

      const db = admin.firestore();
      const usersSnapshot = await db.collection('users').get();
      
      let sendCount = 0;
      let emailBccList: string[] = [];
      
      fs.appendFileSync("server.log", `[Push Broadcast] Iniciando...\n`); console.log(`[Push Broadcast] Iniciando...`);

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Coletar emails para broadcast (ativo por padrão a menos que explicitamente desativado)
        const isEmailEnabled = userData.notificationSettings?.email ?? true;
        if (htmlContent && userData.email && !userData.email.endsWith('@anonymous.com') && isEmailEnabled && userData.termsAccepted === true) {
            emailBccList.push(userData.email);
        }

        const subsSnapshot = await userDoc.ref.collection('pushSubscriptions').get();
        for (const subDoc of subsSnapshot.docs) {
          const subscription = subDoc.data();
          try {
            await webPush.sendNotification(
              subscription as any,
              JSON.stringify({ title, body, url })
            );
            sendCount++;
          } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await subDoc.ref.delete();
            } else {
              console.error('Error sending push notification:', err);
            }
          }
        }
      }

      console.log(`[Push Broadcast] Total de emails coletados: ${emailBccList.length}`);

      // Se houver emails e conteúdo html, envia via SMTP
      if (emailBccList.length > 0 && htmlContent) {
        // Chunk emails to max 50 per document to avoid SMTP limits via BCC
        const chunkSize = 50;
        console.log(`[Push Broadcast] Iniciando disparo SMTP...`);
        for (let i = 0; i < emailBccList.length; i += chunkSize) {
            const chunk = emailBccList.slice(i, i + chunkSize);
            console.log(`[Push Broadcast] Enviando chunk de ${chunk.length} emails`);
            try {
              await sendEmail(
                'alertacriminaloficial@gmail.com', // To (oficial)
                title,                             // Assunto
                htmlContent,                       // HTML
                chunk                              // BCC
              );
              console.log(`[Push Broadcast] Chunk enviado com sucesso via SMTP.`);
            } catch (addErr) {
              console.error(`[Push Broadcast] Erro ao disparar SMTP:`, addErr);
            }
        }
      } else {
         console.log(`[Push Broadcast] Não enviou emails porque: emailsList.length=${emailBccList.length}, htmlContent=${!!htmlContent}`);
      }

      res.status(200).json({ message: `Notificação enviada com sucesso para ${sendCount} dispositivos e ${emailBccList.length} emails.` });
    } catch (error) {
      console.error('Erro ao enviar notificações push:', error);
      res.status(500).json({ error: 'Falha ao enviar notificações' });
    }
  });

  // 🔒 Rota Protegida
  app.post("/api/test-whatsapp", verifyFirebaseToken, async (req, res) => {
    const { to, name } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, error: "Número de destino (to) é obrigatório." });
    }

    if (!twilioClient || !TWILIO_WHATSAPP_NUMBER) {
      return res.status(500).json({ success: false, error: "Integração com WhatsApp não configurada. Verifique as chaves do Twilio nas configurações de Secrets do app." });
    }

    try {
      // O número de origem do Twilio no Sandbox deve ter o prefixo "whatsapp:"
      const from = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
      const dest = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const message = await twilioClient.messages.create({
        body: `🚨 *Alerta Criminal*\n\nOlá ${name || 'Guardião'}! 👋\n\nEste é um teste automatizado confirmando que a sua integração de segurança com o *WhatsApp* pelo Twilio está 100% FUNCIONAL!\n\nAgora você está pronto para receber alertas em tempo real.`,
        from: from,
        to: dest
      });

      console.log("WhatsApp enviado:", message.sid);
      res.json({ success: true, message: "WhatsApp enviado com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao enviar WhatsApp:", error);
      res.status(500).json({ success: false, error: error.message || "Falha ao disparar pelo Twilio" });
    }
  });




  

  

  const distPath = path.join(process.cwd(), 'dist');


  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Vite middleware for development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer();
