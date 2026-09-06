const admin = require("firebase-admin");

function testRules(payload) {
  // simulate the rules
  if (!payload.authorId) return false;
  
  if (!['police', 'accident', 'danger', 'traffic', 'other', 'roubo', 'suspeito', 'vandalismo', 'outro'].includes(payload.type)) {
     console.log("type failed");
     return false;
  }
  
  if (payload.description && typeof payload.description !== 'string') return false;
  
  if (!payload.location || typeof payload.location !== 'object') {
     console.log("location object failed");
     return false;
  }
  
  if (!('lat' in payload.location) || !('lng' in payload.location)) {
     console.log("lat lng failed");
     return false;
  }
  if (typeof payload.location.lat !== 'number' || typeof payload.location.lng !== 'number') {
     console.log("lat lng types failed");
     return false;
  }
  
  if (payload.location.address && typeof payload.location.address !== 'string') {
      console.log("address failed");
      return false;
  }
  
  if (payload.attachments && !Array.isArray(payload.attachments)) return false;
  
  if (!['pending', 'verified', 'false_alert', 'false_alarm'].includes(payload.status)) return false;
  
  if (payload.upvotes !== undefined && typeof payload.upvotes !== 'number') return false;
  
  if (payload.upvotedBy && !Array.isArray(payload.upvotedBy)) return false;
  
  if (payload.visibility && !['public', 'group'].includes(payload.visibility)) {
     console.log("visibility failed");
     return false;
  }
  
  if (payload.groupId !== undefined && payload.groupId !== null && typeof payload.groupId !== 'string') return false;
  if (payload.groupName !== undefined && payload.groupName !== null && typeof payload.groupName !== 'string') return false;
  if (payload.isAnonymous !== undefined && typeof payload.isAnonymous !== 'boolean') return false;
  if (payload.authorName !== undefined && typeof payload.authorName !== 'string') return false;
  if (payload.authorAvatar !== undefined && typeof payload.authorAvatar !== 'string') return false;
  if (payload.authorLevel !== undefined && typeof payload.authorLevel !== 'string') return false;
  if (payload.verified !== undefined && typeof payload.verified !== 'boolean') return false;
  
  return true;
}

const p = {
  authorId: "123",
  isAnonymous: false,
  authorName: "Usuário",
  authorAvatar: "",
  authorLevel: "Iniciante",
  verified: false,
  type: "suspeito",
  location: {
    lat: -25.4284,
    lng: -49.2733,
    address: "Rua X"
  },
  status: 'pending',
  upvotes: 0,
  upvotedBy: [],
  createdAt: new Date(), // mock
  visibility: 'public',
  groupId: null,
  groupName: null,
  description: "Test description"
};

console.log("isValidReport:", testRules(p));
