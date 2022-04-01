const todo = {
  dragging: null,
  action(e) {
    const target = e.target;
    if (target.classList.contains('todo__action')) {
      const action = target.dataset.todoAction;
      const elemItem = target.closest('.todo__item');
      if (action === 'deleted' && elemItem.dataset.todoState === 'deleted') {
        elemItem.remove();
      } else {
        elemItem.dataset.todoState = action;
      }
      this.save();
    } else if (target.classList.contains('todo__add')) {
      this.add();
      this.save();
    }
  },
  add() {
    const elemText = document.querySelector('.todo__text');
    if (elemText.disabled || !elemText.value.length) {
      return;
    }
    document.querySelector('.todo__items').insertAdjacentHTML('beforeend', this.create(elemText.value));
    elemText.value = '';
  },
  create(text) {
    return `<li class="todo__item" data-todo-state="active" draggable="true">
      <span class="todo__task">${text}</span>
      <span class="todo__action todo__action_restore" data-todo-action="active"></span>
      <span class="todo__action todo__action_complete" data-todo-action="completed"></span>
      <span class="todo__action todo__action_delete" data-todo-action="deleted"></span></li>`;
  },
  init() {
    const fromStorage = localStorage.getItem('todo');
    if (fromStorage) {
      document.querySelector('.todo__items').innerHTML = fromStorage;
    }
    document.querySelector('.todo__options').addEventListener('change', this.update);
    document.addEventListener('click', this.action.bind(this));
    this.drag();
  },
  update() {
    const option = document.querySelector('.todo__options').value;
    document.querySelector('.todo__items').dataset.todoOption = option;
    document.querySelector('.todo__text').disabled = option !== 'active';
  },
  save() {
    localStorage.setItem('todo', document.querySelector('.todo__items').innerHTML);
  },
  drag() {
    const elemItems = document.querySelector('.todo__items');
    elemItems.addEventListener('dragstart', (e) => {
      const target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      this.dragging = target;
      window.setTimeout(() => {
        target.classList.add('d-none');
      }, 0);
    });
    elemItems.addEventListener('dragend', (e) => {
      const target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.remove('d-none');
      this.save();
    });
    elemItems.addEventListener('dragover', (e) => {
      const target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      e.preventDefault();
    });
    elemItems.addEventListener('dragenter', (e) => {
      const target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.add('todo__item_dragenter');
    });
    elemItems.addEventListener('dragleave', (e) => {
      const target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.remove('todo__item_dragenter');
    });
    elemItems.addEventListener('drop', (e) => {
      const target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.remove('todo__item_dragenter');
      target.after(this.dragging);
      this.dragging = null;
    });
  }
}

todo.init();
