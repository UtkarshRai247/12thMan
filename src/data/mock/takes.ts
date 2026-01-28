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
    shout: number;
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
      shout: 8,
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
      shout: 3,
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
      shout: 5,
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'RedDevil',
    userClub: 'Manchester United',
    fixtureId: 1003,
    matchRating: 8,
    motmPlayerId: 501,
    text: 'Bruno Fernandes was on fire today! That assist was pure class. Top performance from the lads.',
    reactions: {
      cheer: 67,
      boo: 3,
      shout: 12,
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '5',
    userId: 'user5',
    userName: 'SpursFan',
    userClub: 'Tottenham',
    fixtureId: 1003,
    matchRating: 5,
    text: 'Disappointing result. We need to be more clinical in front of goal. Kane was isolated up top.',
    reactions: {
      cheer: 8,
      boo: 22,
      shout: 4,
    },
    createdAt: new Date(Date.now() - 6900000).toISOString(),
  },
  {
    id: '6',
    userId: 'user6',
    userName: 'BluesForever',
    userClub: 'Chelsea',
    fixtureId: 1002,
    matchRating: 6,
    motmPlayerId: 401,
    text: 'Palmer showing why we signed him. Great energy in midfield but we need to finish our chances.',
    reactions: {
      cheer: 34,
      boo: 7,
      shout: 9,
    },
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: '7',
    userId: 'user7',
    userName: 'Culé',
    userClub: 'Barcelona',
    fixtureId: 1004,
    matchRating: 10,
    motmPlayerId: 701,
    text: 'MES QUE UN CLUB! What a night at Camp Nou! The team played with heart and passion. Visca Barça!',
    reactions: {
      cheer: 124,
      boo: 1,
      shout: 28,
    },
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: '8',
    userId: 'user8',
    userName: 'Madridista',
    userClub: 'Real Madrid',
    fixtureId: 1004,
    matchRating: 3,
    text: 'Not our day. Defensive mistakes cost us. We\'ll come back stronger in the next match.',
    reactions: {
      cheer: 12,
      boo: 45,
      shout: 6,
    },
    createdAt: new Date(Date.now() - 10500000).toISOString(),
  },
  {
    id: '9',
    userId: 'user9',
    userName: 'GunnerNation',
    userClub: 'Arsenal',
    fixtureId: 1001,
    matchRating: 9,
    motmPlayerId: 102,
    text: 'Ødegaard pulling the strings in midfield. That pass to Saka was world class. We\'re building something special here.',
    reactions: {
      cheer: 89,
      boo: 4,
      shout: 15,
    },
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: '10',
    userId: 'user10',
    userName: 'Citizen',
    userClub: 'Manchester City',
    fixtureId: 1001,
    matchRating: 5,
    motmPlayerId: 202,
    text: 'De Bruyne tried his best but we were second best today. Credit to Arsenal, they wanted it more.',
    reactions: {
      cheer: 19,
      boo: 31,
      shout: 7,
    },
    createdAt: new Date(Date.now() - 2100000).toISOString(),
  },
  {
    id: '11',
    userId: 'user11',
    userName: 'AnfieldRoar',
    userClub: 'Liverpool',
    fixtureId: 1002,
    matchRating: 8,
    motmPlayerId: 301,
    text: 'Salah\'s goal was pure magic! The way he cut inside and finished... world class. YNWA!',
    reactions: {
      cheer: 76,
      boo: 2,
      shout: 18,
    },
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: '12',
    userId: 'user12',
    userName: 'ChelseaBlue',
    userClub: 'Chelsea',
    fixtureId: 1002,
    matchRating: 7,
    text: 'Good fight from the boys. We matched them for most of the game. Just need that final touch.',
    reactions: {
      cheer: 45,
      boo: 9,
      shout: 11,
    },
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: '13',
    userId: 'user13',
    userName: 'UnitedStand',
    userClub: 'Manchester United',
    fixtureId: 1003,
    matchRating: 8,
    motmPlayerId: 502,
    text: 'Rashford\'s pace was unstoppable today. When he\'s on form, there\'s no stopping him. Great team performance!',
    reactions: {
      cheer: 92,
      boo: 5,
      shout: 21,
    },
    createdAt: new Date(Date.now() - 6600000).toISOString(),
  },
  {
    id: '14',
    userId: 'user14',
    userName: 'Lilywhite',
    userClub: 'Tottenham',
    fixtureId: 1003,
    matchRating: 6,
    text: 'We showed character to come back but couldn\'t hold on. Son was bright when he came on. Need more from the midfield.',
    reactions: {
      cheer: 23,
      boo: 18,
      shout: 8,
    },
    createdAt: new Date(Date.now() - 6300000).toISOString(),
  },
  {
    id: '15',
    userId: 'user15',
    userName: 'BarcaFan',
    userClub: 'Barcelona',
    fixtureId: 1004,
    matchRating: 9,
    motmPlayerId: 702,
    text: 'Pedri\'s vision is incredible. That through ball was perfection. The future is bright!',
    reactions: {
      cheer: 108,
      boo: 2,
      shout: 24,
    },
    createdAt: new Date(Date.now() - 10200000).toISOString(),
  },
];
