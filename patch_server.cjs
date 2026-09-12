const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
  // 🔒 Rota para Adicionar Comentários (Bypass de Rules)
  app.post("/api/comments", verifyFirebaseToken, async (req, res) => {
    try {
      const { itemId, itemType, content, authorName, authorAvatar } = req.body;
      const user = (req as any).user;
      const db = admin.firestore();

      if (!itemId || !itemType || !content) {
        return res.status(400).json({ error: "Faltam parâmetros obrigatórios." });
      }

      const commentData = {
        itemId,
        itemType,
        authorId: user.uid,
        authorName: authorName || user.name || 'Usuário Anônimo',
        authorAvatar: authorAvatar || user.picture || '',
        content: content.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('comments').add(commentData);

      const itemRef = db.collection(itemType === 'report' ? 'reports' : 'posts').doc(itemId);
      await itemRef.update({
        commentsCount: admin.firestore.FieldValue.increment(1)
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao adicionar comentário:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
`;

code = code.replace("  const distPath = path.join(process.cwd(), 'dist');", newRoute);

fs.writeFileSync('server.ts', code);
