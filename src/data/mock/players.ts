import { Player, PlayerPosition } from '../../lib/apiFootball/types';

export const mockPlayers: Player[] = [
  // Arsenal players
  { id: 101, name: 'Bukayo Saka', position: PlayerPosition.FW, number: 7, teamId: 1 },
  { id: 102, name: 'Martin Ødegaard', position: PlayerPosition.MF, number: 8, teamId: 1 },
  { id: 103, name: 'William Saliba', position: PlayerPosition.DF, number: 2, teamId: 1 },
  { id: 104, name: 'Aaron Ramsdale', position: PlayerPosition.GK, number: 1, teamId: 1 },
  { id: 105, name: 'Gabriel Jesus', position: PlayerPosition.FW, number: 9, teamId: 1 },
  { id: 106, name: 'Declan Rice', position: PlayerPosition.MF, number: 41, teamId: 1 },
  { id: 107, name: 'Gabriel Magalhães', position: PlayerPosition.DF, number: 6, teamId: 1 },
  { id: 108, name: 'Kai Havertz', position: PlayerPosition.MF, number: 29, teamId: 1 },
  
  // Man City players
  { id: 201, name: 'Erling Haaland', position: PlayerPosition.FW, number: 9, teamId: 2 },
  { id: 202, name: 'Kevin De Bruyne', position: PlayerPosition.MF, number: 17, teamId: 2 },
  { id: 203, name: 'Rúben Dias', position: PlayerPosition.DF, number: 3, teamId: 2 },
  { id: 204, name: 'Ederson', position: PlayerPosition.GK, number: 31, teamId: 2 },
  { id: 205, name: 'Phil Foden', position: PlayerPosition.MF, number: 47, teamId: 2 },
  { id: 206, name: 'Rodri', position: PlayerPosition.MF, number: 16, teamId: 2 },
  { id: 207, name: 'Bernardo Silva', position: PlayerPosition.MF, number: 20, teamId: 2 },
  { id: 208, name: 'Kyle Walker', position: PlayerPosition.DF, number: 2, teamId: 2 },
  
  // Liverpool players
  { id: 301, name: 'Mohamed Salah', position: PlayerPosition.FW, number: 11, teamId: 3 },
  { id: 302, name: 'Virgil van Dijk', position: PlayerPosition.DF, number: 4, teamId: 3 },
  { id: 303, name: 'Alisson', position: PlayerPosition.GK, number: 1, teamId: 3 },
  { id: 304, name: 'Darwin Núñez', position: PlayerPosition.FW, number: 9, teamId: 3 },
  { id: 305, name: 'Luis Díaz', position: PlayerPosition.FW, number: 7, teamId: 3 },
  { id: 306, name: 'Trent Alexander-Arnold', position: PlayerPosition.DF, number: 66, teamId: 3 },
  { id: 307, name: 'Andy Robertson', position: PlayerPosition.DF, number: 26, teamId: 3 },
  { id: 308, name: 'Dominik Szoboszlai', position: PlayerPosition.MF, number: 8, teamId: 3 },
  
  // Chelsea players
  { id: 401, name: 'Cole Palmer', position: PlayerPosition.MF, number: 20, teamId: 4 },
  { id: 402, name: 'Thiago Silva', position: PlayerPosition.DF, number: 6, teamId: 4 },
  { id: 403, name: 'Enzo Fernández', position: PlayerPosition.MF, number: 8, teamId: 4 },
  { id: 404, name: 'Nicolas Jackson', position: PlayerPosition.FW, number: 15, teamId: 4 },
  { id: 405, name: 'Reece James', position: PlayerPosition.DF, number: 24, teamId: 4 },
  { id: 406, name: 'Moises Caicedo', position: PlayerPosition.MF, number: 25, teamId: 4 },
  { id: 407, name: 'Raheem Sterling', position: PlayerPosition.FW, number: 7, teamId: 4 },
  { id: 408, name: 'Robert Sánchez', position: PlayerPosition.GK, number: 1, teamId: 4 },
  
  // Man United players
  { id: 501, name: 'Bruno Fernandes', position: PlayerPosition.MF, number: 18, teamId: 5 },
  { id: 502, name: 'Marcus Rashford', position: PlayerPosition.FW, number: 10, teamId: 5 },
  { id: 503, name: 'Casemiro', position: PlayerPosition.MF, number: 18, teamId: 5 },
  { id: 504, name: 'Raphaël Varane', position: PlayerPosition.DF, number: 19, teamId: 5 },
  { id: 505, name: 'André Onana', position: PlayerPosition.GK, number: 24, teamId: 5 },
  { id: 506, name: 'Rasmus Højlund', position: PlayerPosition.FW, number: 11, teamId: 5 },
  { id: 507, name: 'Antony', position: PlayerPosition.FW, number: 21, teamId: 5 },
  { id: 508, name: 'Luke Shaw', position: PlayerPosition.DF, number: 23, teamId: 5 },
  
  // Tottenham players
  { id: 601, name: 'Son Heung-min', position: PlayerPosition.FW, number: 7, teamId: 6 },
  { id: 602, name: 'James Maddison', position: PlayerPosition.MF, number: 10, teamId: 6 },
  { id: 603, name: 'Harry Kane', position: PlayerPosition.FW, number: 10, teamId: 6 },
  { id: 604, name: 'Cristian Romero', position: PlayerPosition.DF, number: 17, teamId: 6 },
  { id: 605, name: 'Guglielmo Vicario', position: PlayerPosition.GK, number: 13, teamId: 6 },
  { id: 606, name: 'Dejan Kulusevski', position: PlayerPosition.FW, number: 21, teamId: 6 },
  { id: 607, name: 'Yves Bissouma', position: PlayerPosition.MF, number: 8, teamId: 6 },
  { id: 608, name: 'Pedro Porro', position: PlayerPosition.DF, number: 23, teamId: 6 },
  
  // Barcelona players
  { id: 701, name: 'Robert Lewandowski', position: PlayerPosition.FW, number: 9, teamId: 7 },
  { id: 702, name: 'Pedri', position: PlayerPosition.MF, number: 8, teamId: 7 },
  { id: 703, name: 'Gavi', position: PlayerPosition.MF, number: 6, teamId: 7 },
  { id: 704, name: 'Frenkie de Jong', position: PlayerPosition.MF, number: 21, teamId: 7 },
  { id: 705, name: 'Ronald Araújo', position: PlayerPosition.DF, number: 4, teamId: 7 },
  { id: 706, name: 'Marc-André ter Stegen', position: PlayerPosition.GK, number: 1, teamId: 7 },
  { id: 707, name: 'Lamine Yamal', position: PlayerPosition.FW, number: 27, teamId: 7 },
  { id: 708, name: 'Jules Koundé', position: PlayerPosition.DF, number: 23, teamId: 7 },
  
  // Real Madrid players
  { id: 801, name: 'Karim Benzema', position: PlayerPosition.FW, number: 9, teamId: 8 },
  { id: 802, name: 'Luka Modrić', position: PlayerPosition.MF, number: 10, teamId: 8 },
  { id: 803, name: 'Vinicius Jr', position: PlayerPosition.FW, number: 7, teamId: 8 },
  { id: 804, name: 'Jude Bellingham', position: PlayerPosition.MF, number: 5, teamId: 8 },
  { id: 805, name: 'Thibaut Courtois', position: PlayerPosition.GK, number: 1, teamId: 8 },
  { id: 806, name: 'Éder Militão', position: PlayerPosition.DF, number: 3, teamId: 8 },
  { id: 807, name: 'Rodrygo', position: PlayerPosition.FW, number: 11, teamId: 8 },
  { id: 808, name: 'David Alaba', position: PlayerPosition.DF, number: 4, teamId: 8 },
];
