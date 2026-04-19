export interface SinData {
  date: string;
  score: number;
  confession: string;
}
export interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: string | null;
}
export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string; // JSON 형태의 문자열이 들어옴
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  labels: GitHubLabel[];
}

export interface SinRecord extends SinData {
  id?: number;
}
