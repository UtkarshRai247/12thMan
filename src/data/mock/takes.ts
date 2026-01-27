/**
 * Mock user takes/posts
 */

export interface Take {
  id: string;
  userId: string;
  userName: string;
  userClub: string;
  fixtureId: number;
  matchRating: number;
  motmPlayerId?: number;
  text: string;
  reactions: {
    cheer: number;
    boo: number;
    comment: number;
  };
  createdAt: string;
}

export const mockTakes: Take[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Gooner4Life',
    userClub: 'Arsenal',
    fixtureId: 1001,
    matchRating: 9,
    motmPlayerId: 101,
    text: 'What a performance! Saka was absolutely electric tonight. The atmosphere at the Emirates was incredible.',
    reactions: {
      cheer: 42,
      boo: 2,
      comment: 8,
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Cityzen',
    userClub: 'Manchester City',
    fixtureId: 1001,
    matchRating: 4,
    motmPlayerId: 201,
    text: 'Tough loss. We had our chances but couldn\'t convert. Need to bounce back next week.',
    reactions: {
      cheer: 5,
      boo: 15,
      comment: 3,
    },
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Kopite',
    userClub: 'Liverpool',
    fixtureId: 1002,
    matchRating: 7,
    text: 'Solid first half. Salah looking sharp. Let\'s keep this momentum!',
    reactions: {
      cheer: 28,
      boo: 1,
      comment: 5,
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
