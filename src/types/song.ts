export interface Song {
  id: string;
  name: string;
  artist?: string;
  imagePath: string;
  musicUrl: string;
  category: 'stage' | 'bonus';
  genre?: string;
  estimatedDuration?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export const SONG_BANK: Song[] = [
  {
    id: 'stage1',
    name: 'Watch This (우릴 봐)',
    artist: 'K-pop',
    imagePath: '/lovable-uploads/50805a81-529d-44e2-b4eb-a42fb5fda7a2.png',
    musicUrl: '/audio/stages/stage-1-watch-this.mp3',
    category: 'stage',
    genre: 'K-pop',
    estimatedDuration: '3:24',
    difficulty: 'Easy'
  },
  {
    id: 'stage2',
    name: 'Darkside Rewind',
    artist: 'Electronic',
    imagePath: '/lovable-uploads/63013381-c47a-40f7-8ae6-243a877fff22.png',
    musicUrl: '/audio/stages/stage-2-darkside-rewind.mp3',
    category: 'stage',
    genre: 'Electronic',
    estimatedDuration: '4:02',
    difficulty: 'Medium'
  },
  {
    id: 'stage3',
    name: 'Voltage',
    artist: 'Synthwave',
    imagePath: '/lovable-uploads/a76fc892-c505-44de-b79c-2deeebf4b00f.png',
    musicUrl: '/audio/stages/stage-3-voltage.mp3',
    category: 'stage',
    genre: 'Synthwave',
    estimatedDuration: '3:45',
    difficulty: 'Medium'
  },
  {
    id: 'stage4',
    name: 'Sport Light Fever',
    artist: 'Dance',
    imagePath: '/lovable-uploads/635966d7-9ab0-400a-b557-d74c51b2e6f8.png',
    musicUrl: '/audio/stages/stage-4-sport-light-fever.mp3',
    category: 'stage',
    genre: 'Dance',
    estimatedDuration: '3:18',
    difficulty: 'Hard'
  },
  {
    id: 'stage5',
    name: '너만 보여 (Only You)',
    artist: 'K-pop',
    imagePath: '/lovable-uploads/695a30f1-9981-4fc0-9691-563319872f86.png',
    musicUrl: '/audio/stages/stage-5-only-you.mp3',
    category: 'stage',
    genre: 'K-pop',
    estimatedDuration: '3:55',
    difficulty: 'Medium'
  },
  {
    id: 'stage6',
    name: 'Off Guard',
    artist: 'Electronic',
    imagePath: '/lovable-uploads/4163f6e2-7389-4c34-8abb-cae2f601991c.png',
    musicUrl: '/audio/stages/stage-6-off-guard.mp3',
    category: 'stage',
    genre: 'Electronic',
    estimatedDuration: '4:12',
    difficulty: 'Hard'
  },
  {
    id: 'stage7',
    name: 'BANG!',
    artist: 'Electronic',
    imagePath: '/lovable-uploads/24aa969f-156d-4d7c-9092-8ce076fa093a.png',
    musicUrl: '/audio/stages/stage-7-bang.mp3',
    category: 'stage',
    genre: 'Electronic',
    estimatedDuration: '3:33',
    difficulty: 'Hard'
  },
  {
    id: 'bonus1',
    name: 'Nope! (안 돼!)',
    artist: 'K-pop',
    imagePath: '/lovable-uploads/a5a140eb-6183-45a9-9155-9064030a0f51.png',
    musicUrl: '/audio/bonus/bonus-1-nope.mp3',
    category: 'bonus',
    genre: 'K-pop',
    estimatedDuration: '2:58',
    difficulty: 'Easy'
  },
  {
    id: 'bonus2',
    name: 'Sugar Crush',
    artist: 'Electronic',
    imagePath: '/lovable-uploads/bc1b473d-7e12-4d5b-8abd-6fe2997572e5.png',
    musicUrl: '/audio/bonus/bonus-2-sugar-crush.mp3',
    category: 'bonus',
    genre: 'Electronic',
    estimatedDuration: '3:41',
    difficulty: 'Medium'
  }
];