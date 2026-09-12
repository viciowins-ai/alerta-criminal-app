const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
  // 🔒 Rota para Buscar Comentários
  app.get("/api/comments", verifyFirebaseToken, async (req, res) => {
    try {
      const { itemId } = req.query;
      const db = admin.firestore();
      
      if (!itemId) return res.status(400).json({ error: "itemId is required" });

      const snapshot = await db.collection('comments')
        .where('itemId', '==', itemId)
        .orderBy('createdAt', 'asc')
        .get();

      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Serialize timestamp for JSON
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
      }));

      res.json({ comments });
    } catch (error: any) {
      console.error("Erro ao buscar comentários:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 🔒 Rota para Adicionar Comentários (Bypass de Rules)
`;

code = code.replace("  // 🔒 Rota para Adicionar Comentários (Bypass de Rules)", newRoutes);

fs.writeFileSync('server.ts', code);
