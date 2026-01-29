declare module '@max-xoo/fotmob' {
  interface FotmobInstance {
    getMatchDetails(matchId: string): Promise<unknown>;
  }
  const Fotmob: new () => FotmobInstance;
  export default Fotmob;
}
