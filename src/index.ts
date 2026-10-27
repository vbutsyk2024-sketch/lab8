import './scss/style.scss';
import { ITodo } from './models/Todo';
import { ApiTodoRepository } from './repositories/ApiTodoRepository';

const API_URL = 'https://69b11abdadac80b427c3fff2.mockapi.io/api/v1/todoItem';
const USER_ID = 15;

const todoRepository = new ApiTodoRepository(API_URL);

document.addEventListener('DOMContentLoaded', () => {
  const mainHeader = document.getElementById('mainHeader');
  if (mainHeader) mainHeader.textContent += ` - Студент #${USER_ID}`;

  const form = document.getElementById('todoForm') as HTMLFormElement | null;
  const list = document.getElementById('todoList') as HTMLElement | null;
  const template = document.getElementById('task-template') as HTMLTemplateElement | null;
  const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement | null;

  let isEditing = false;
  let currentEditId: string | null = null;

  async function fetchTodos(): Promise<void> {
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    try {
      const data: ITodo[] = await todoRepository.getAll();
      if (list) list.innerHTML = '';
      data.forEach((task: ITodo) => addTaskToDOM(task, true));
    } catch (err: unknown) {
      console.error(err);
      alert('Не вдалося завантажити завдання.');
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
  }

  function formatDate(timestamp?: number): string {
    if (!timestamp) return 'Невідомо';
    const date = new Date(Number(timestamp) * 1000);
    return isNaN(date.getTime()) ? String(timestamp) : date.toLocaleDateString('uk-UA');
  }

  function addTaskToDOM(task: ITodo, append = false): void {
    if (!template || !list) return;

    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const el = fragment.querySelector('.task-card') as HTMLElement | null;
    if (!el) return;

    if (task.id) el.dataset.id = task.id;
    if (task.isDone) el.classList.add('task-card--done');

    const idEl = el.querySelector('.task-card__id');
    if (idEl) idEl.textContent = task.id || '';

    const userIdEl = el.querySelector('.task-card__userid');
    if (userIdEl) userIdEl.textContent = String(task.userId);

    const titleEl = el.querySelector('.task-card__title');
    if (titleEl) titleEl.textContent = task.title;

    const tagEl = el.querySelector('.task-card__tag');
    if (tagEl) tagEl.textContent = task.tag;

    const descEl = el.querySelector('.task-card__desc');
    if (descEl) descEl.textContent = task.description;

    const deadlineEl = el.querySelector('.task-card__deadline');
    if (deadlineEl) deadlineEl.textContent = task.deadline || 'Без дати';

    const createdEl = el.querySelector('.task-card__created');
    if (createdEl) createdEl.textContent = formatDate(task.createdAt);

    if (task.isDone) {
      const statusEl = el.querySelector('.task-card__status');
      if (statusEl) statusEl.textContent = `✅ Виконано`;
      const completeBtn = el.querySelector('.btn--complete') as HTMLElement | null;
      if (completeBtn) completeBtn.style.opacity = '0.5';
    }

    if (append) list.appendChild(el);
    else list.prepend(el);
  }

  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    if (!form) return;

    const formData = new FormData(form);

    const taskData: ITodo = {
      userId: USER_ID,
      title: (formData.get('title') as string) || '',
      description: (formData.get('description') as string) || '',
      tag: (formData.get('tag') as string) || 'Навчання',
      deadline: (formData.get('deadline') as string) || '',
      createdAt: isEditing ? undefined : Math.floor(Date.now() / 1000),
      isDone: false,
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
      if (isEditing && currentEditId) {
        await todoRepository.update(currentEditId, taskData);
        await fetchTodos();
        resetFormState();
      } else {
        const createdTask: ITodo = await todoRepository.create(taskData);
        addTaskToDOM(createdTask);
        form.reset();
      }
    } catch (err: unknown) {
      console.error(err);
      alert('Помилка при збереженні.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  form?.addEventListener('reset', () => resetFormState());

  function resetFormState(): void {
    isEditing = false;
    currentEditId = null;
    if (form) form.reset();
    if (submitBtn) {
      submitBtn.innerHTML = `<svg class="btn__icon"><use href="img/sprite.svg#icon-save"></use></svg> <span class="btn__text">Додати задачу</span>`;
      submitBtn.classList.remove('btn--edit');
      submitBtn.classList.add('btn--primary');
    }
  }

  list?.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest('.btn') as HTMLButtonElement | null;
    if (!btn) return;

    const card = btn.closest('.task-card') as HTMLElement | null;
    if (!card) return;

    const taskId = card.dataset.id;
    if (!taskId) return;

    if (btn.classList.contains('btn--delete')) {
      if (confirm('Видалити цю задачу з сервера?')) {
        try {
          const success: boolean = await todoRepository.delete(taskId);
          if (success) card.remove();
        } catch (err: unknown) {
          console.error(err);
          alert('Не вдалося видалити.');
        }
      }
    }

    if (btn.classList.contains('btn--complete')) {
      const isCurrentlyDone = card.classList.contains('task-card--done');
      try {
        await todoRepository.update(taskId, { isDone: !isCurrentlyDone });
        card.classList.toggle('task-card--done');
        const status = card.querySelector('.task-card__status') as HTMLElement | null;
        if (status) {
          if (!isCurrentlyDone) {
            status.textContent = `✅ Виконано`;
            btn.style.opacity = '0.5';
          } else {
            status.textContent = `Статус: В роботі`;
            btn.style.opacity = '1';
          }
        }
      } catch (err: unknown) {
        console.error(err);
      }
    }

    if (btn.classList.contains('btn--edit-action') && form) {
      isEditing = true;
      currentEditId = taskId;

      const titleInput = form.elements.namedItem('title') as HTMLInputElement | null;
      if (titleInput) titleInput.value = card.querySelector('.task-card__title')?.textContent || '';

      const descInput = form.elements.namedItem('description') as HTMLTextAreaElement | null;
      if (descInput) descInput.value = card.querySelector('.task-card__desc')?.textContent || '';

      const tagSelect = form.elements.namedItem('tag') as HTMLSelectElement | null;
      if (tagSelect) tagSelect.value = card.querySelector('.task-card__tag')?.textContent || 'Навчання';

      const deadline = card.querySelector('.task-card__deadline')?.textContent;
      const deadlineInput = form.elements.namedItem('deadline') as HTMLInputElement | null;
      if (deadlineInput) deadlineInput.value = deadline === 'Без дати' ? '' : deadline || '';

      if (submitBtn) {
        submitBtn.innerHTML = `<svg class="btn__icon"><use href="img/sprite.svg#icon-edit"></use></svg> <span class="btn__text">Зберегти зміни</span>`;
        submitBtn.classList.remove('btn--primary');
        submitBtn.classList.add('btn--edit');
      }
      form.scrollIntoView({ behavior: 'smooth' });
    }
  });

  fetchTodos();
});