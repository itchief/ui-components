const todo = {
  init() {
    document.querySelector('.todo__options').addEventListener('change', this.update);
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('todo__action')) {
        const action = $(target).attr('data-action');
        target.closest('.todo__item').dataset.state = action;

      } else if (target.classList.contains('todo__add')) {
        if (document.querySelector('.todo__text').disabled) {
          return;
        }
        const text = document.querySelector('.todo__text');
        if (!text.value.length) {
          return;
        }
        document.querySelector('.todo__items').insertAdjacentHTML('beforeend', this.create(text.value));
        text.value = '';
      }
    });
  },
  create(text) {
    return `<li class="todo__item" data-state="active">
      <span class="todo__task">${text}</span>
      <span class="todo__action todo__action_restore" data-action="active"></span>
      <span class="todo__action todo__action_complete" data-action="completed"></span>
      <span class="todo__action todo__action_delete" data-action="deleted"></span></li>`;
  },
  update() {
    const section = document.querySelector('.todo__options').value;
    document.querySelector('.todo__text').disabled = section !== 'active';
    document.querySelector('.todo__items').dataset.items = section;
    /*document.querySelectorAll('.todo__item').forEach((item) => {
      const state = item.dataset.state;
      if (state === section) {
        item.classList.remove('todo__item_hide');
      } else {
        item.classList.add('todo__item_hide');
      }
    });*/
  }
}

todo.init();




var dragging = null;

$('.todo__item').on('dragstart', function(e) {
  dragging = this;
  window.setTimeout(function(){
    $(dragging).addClass('d-none');
  },0);
})

$('.todo__item').on('dragend', function(e) {
  $(this).removeClass('d-none');
})

$('.todo__item').on('dragover', function(e) {
  return false;
})

$('.todo__item').on('dragenter', function(e) {
  $(this).addClass('hovered');
})

$('.todo__item').on('dragleave', function(e) {
  $(this).removeClass('hovered');
})


$('.todo__item').on('drop', function(e) {
  $(this).removeClass('hovered');
  $(this).after(dragging);
  dragging = null;
})
