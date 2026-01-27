import { Player, PlayerPosition } from '../../lib/apiFootball/types';

export const mockPlayers: Player[] = [
  // Arsenal players
  { id: 101, name: 'Bukayo Saka', position: PlayerPosition.FW, number: 7, teamId: 1 },
  { id: 102, name: 'Martin Ødegaard', position: PlayerPosition.MF, number: 8, teamId: 1 },
  { id: 103, name: 'William Saliba', position: PlayerPosition.DF, number: 2, teamId: 1 },
  { id: 104, name: 'Aaron Ramsdale', position: PlayerPosition.GK, number: 1, teamId: 1 },
  
  // Man City players
  { id: 201, name: 'Erling Haaland', position: PlayerPosition.FW, number: 9, teamId: 2 },
  { id: 202, name: 'Kevin De Bruyne', position: PlayerPosition.MF, number: 17, teamId: 2 },
  { id: 203, name: 'Rúben Dias', position: PlayerPosition.DF, number: 3, teamId: 2 },
  { id: 204, name: 'Ederson', position: PlayerPosition.GK, number: 31, teamId: 2 },
  
  // Liverpool players
  { id: 301, name: 'Mohamed Salah', position: PlayerPosition.FW, number: 11, teamId: 3 },
  { id: 302, name: 'Virgil van Dijk', position: PlayerPosition.DF, number: 4, teamId: 3 },
  { id: 303, name: 'Alisson', position: PlayerPosition.GK, number: 1, teamId: 3 },
  
  // Chelsea players
  { id: 401, name: 'Cole Palmer', position: PlayerPosition.MF, number: 20, teamId: 4 },
  { id: 402, name: 'Thiago Silva', position: PlayerPosition.DF, number: 6, teamId: 4 },
];
