import { ITodo } from '../models/Todo';

export interface ITodoRepository {
  getAll(): Promise<ITodo[]>;
  create(todo: ITodo): Promise<ITodo>;
  update(id: string, todo: Partial<ITodo>): Promise<ITodo>;
  delete(id: string): Promise<boolean>;
}