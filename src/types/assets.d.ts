// Zvucni fajlovi (/assets/audio) su jedina lokalna binarna sredstva koja se
// importuju direktno u TS kodu (slike idu preko Supabase Storage URL-ova) --
// Metro ih vec tretira kao asset (metro-config assetExts), samo TS ne zna tip.
declare module '*.wav' {
  const value: number;
  export default value;
}
