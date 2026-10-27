export interface ITodo {
  id?: string;
  userId: number;
  title: string;
  description: string;
  tag: string;
  deadline: string;
  createdAt?: number;
  isDone: boolean;
}