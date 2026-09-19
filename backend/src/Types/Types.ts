export interface Movie {
    id: number,
    title: string,
    key: string,
    description: string | null,
    length: string | null,
    year: number | null,
    genre: string | null,
    timestamp: Date,
    times_played: number
};

export type Images = {
  key: string,
  url: string,
  mimeType: string,
  title: string,
  originalName: string,
  usage?: string | null
}

export type S3File = Express.Multer.File & {
  location: string;
  key: string;
  bucket: string;
};


export type MovieData = {
    title: string,
    genre: string,
    description: string,
    year: number,
    length: string,
    dbPath: string,
    images: S3File[],
    media_format: string,
    season_number?: number,
    episode_number?: number,
    episode_title?: string,
    series_id: number   
}