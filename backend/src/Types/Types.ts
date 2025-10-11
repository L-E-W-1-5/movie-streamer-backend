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