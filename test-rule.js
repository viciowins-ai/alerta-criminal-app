const data = {
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
  createdAt: new Date(),
  visibility: 'public',
  groupId: null,
  groupName: null,
  description: "Test description"
};

const allowed = ['authorId', 'type', 'description', 'location', 'status', 'upvotes', 'upvotedBy', 'createdAt', 'attachments', 'visibility', 'groupId', 'groupName', 'isAnonymous', 'authorName', 'authorAvatar', 'authorLevel', 'verified'];

const hasOnlyAllowed = Object.keys(data).every(k => allowed.includes(k));
console.log("hasOnlyAllowed:", hasOnlyAllowed);
console.log("Missing from allowed:", Object.keys(data).filter(k => !allowed.includes(k)));

const hasRequired = ['authorId', 'type', 'location', 'status', 'createdAt'].every(k => Object.keys(data).includes(k));
console.log("hasRequired:", hasRequired);

