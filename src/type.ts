// src/type.ts
export interface Photo {
  id: string;
  path: string;
  caption: string;
}

export interface Album {
  id: string;
  title: string;
  date: string;
  photos: Photo[];
}