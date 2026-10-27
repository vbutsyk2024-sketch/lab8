import { ITodo } from '../models/Todo';
import { ITodoRepository } from './TodoRepository';

export class ApiTodoRepository implements ITodoRepository {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async getAll(): Promise<ITodo[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) throw new Error('Помилка завантаження даних');
    return await response.json();
  }

  async create(todo: ITodo): Promise<ITodo> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Помилка створення запису');
    return await response.json();
  }

  async update(id: string, todo: Partial<ITodo>): Promise<ITodo> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Помилка оновлення');
    return await response.json();
  }

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  }
}