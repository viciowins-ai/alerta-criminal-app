const fs = require('fs');
let code = fs.readFileSync('src/pages/NotificationSettingsPage.tsx', 'utf8');

code = code.replace(/import \{ doc, getDoc, updateDoc \} from 'firebase\/firestore';/, "import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';");

const newEmailCode = `                try {
                  const mailRef = collection(db, 'mail');
                  await addDoc(mailRef, {
                    to: user.email,
                    message: {
                      subject: "Teste de Notificação - Alerta Criminal",
                      text: "Olá!\\n\\nSua configuração de e-mail no Alerta Criminal está funcionando perfeitamente!\\n\\nFique seguro.",
                      html: "<h2>Olá!</h2><p>Sua configuração de e-mail no Alerta Criminal está funcionando perfeitamente!</p><p>Fique seguro.</p>"
                    }
                  });
                  alert("Comando de e-mail enviado para o Firebase com sucesso! Verifique sua caixa de entrada em instantes.");
                } catch (e: any) {
                  alert("Erro ao salvar o e-mail no Firebase: " + e.message);
                }`;

const newWhatsappCode = `                try {
                  const msgRef = collection(db, 'whatsapp_messages');
                  await addDoc(msgRef, {
                    to: phone,
                    body: "Alerta Criminal: Sua configuracao de WhatsApp esta funcionando perfeitamente! Fique seguro."
                  });
                  alert("Comando de WhatsApp enviado para o Firebase com sucesso!");
                } catch (e: any) {
                  alert("Erro ao salvar o WhatsApp no Firebase: " + e.message);
                }`;

code = code.replace(/try \{\s+const res = await fetch\('\/api\/test-email'[\s\S]*?alert\("Erro de rede: O servidor backend \(API\) está offline ou inacessível no seu domínio\."\);\s+\}/, newEmailCode);

code = code.replace(/try \{\s+const res = await fetch\('\/api\/test-whatsapp'[\s\S]*?alert\("Erro de rede: O servidor backend \(API\) está offline ou inacessível no seu domínio\."\);\s+\}/, newWhatsappCode);

fs.writeFileSync('src/pages/NotificationSettingsPage.tsx', code);
