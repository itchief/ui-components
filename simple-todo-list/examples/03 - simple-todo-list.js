const todo = {
  dragging: null,
  action(e) {
    const target = e.target;
    if (target.classList.contains('todo__action')) {
      const action = target.dataset.action;
      const todoItem = target.closest('.todo__item');
      if (action === 'deleted' && todoItem.dataset.state === 'deleted') {
        target.closest('.todo__item').remove();
      } else {
        todoItem.dataset.state = action;
      }
      this.save();
    } else if (target.classList.contains('todo__add')) {
      this.add();
      this.save();
    }
  },
  add() {
    const text = document.querySelector('.todo__text');
    if (document.querySelector('.todo__text').disabled || !text.value.length) {
      return;
    }
    document.querySelector('.todo__items').insertAdjacentHTML('beforeend', this.create(text.value));
    text.value = '';
  },
  create(text) {
    return `<li class="todo__item" data-state="active" draggable="true">
      <span class="todo__task">${text}</span>
      <span class="todo__action todo__action_restore" data-action="active"></span>
      <span class="todo__action todo__action_complete" data-action="completed"></span>
      <span class="todo__action todo__action_delete" data-action="deleted"></span></li>`;
  },
  init() {
    const data = localStorage.getItem('todo');
    const todoItems = document.querySelector('.todo__items');
    if (data) {
      todoItems.innerHTML = data;
    }
    document.querySelector('.todo__options').addEventListener('change', this.update);
    document.addEventListener('click', this.action.bind(this));
    this.drag();
  },
  update() {
    const section = document.querySelector('.todo__options').value;
    document.querySelector('.todo__text').disabled = section !== 'active';
    document.querySelector('.todo__items').dataset.items = section;
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
