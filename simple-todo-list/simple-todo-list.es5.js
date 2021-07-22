'use strict';

if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (Element.prototype.matches.call(el, s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

var todo = {
  dragging: null,
  action: function(e) {
    var target = e.target;
    if (target.classList.contains('todo__action')) {
      var action = target.dataset.action;
      var todoItem = target.closest('.todo__item');
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
  add: function() {
    var text = document.querySelector('.todo__text');
    if (document.querySelector('.todo__text').disabled || !text.value.length) {
      return;
    }
    document.querySelector('.todo__items').insertAdjacentHTML('beforeend', this.create(text.value));
    text.value = '';
  },
  create: function(text) {
    return '<li class="todo__item" data-state="active" draggable="true"><span class="todo__task">'.concat(text, '</span><span class="todo__action todo__action_restore" data-action="active"></span><span class="todo__action todo__action_complete" data-action="completed"></span><span class="todo__action todo__action_delete" data-action="deleted"></span></li>');
  },
  init: function() {
    var data = window.localStorage.getItem('todo');
    var todoItems = document.querySelector('.todo__items');
    if (data) {
      todoItems.innerHTML = data;
    }
    document.querySelector('.todo__options').addEventListener('change', this.update);
    document.addEventListener('click', this.action.bind(this));
    this.drag();
  },
  update: function() {
    var section = document.querySelector('.todo__options').value;
    document.querySelector('.todo__text').disabled = section !== 'active';
    document.querySelector('.todo__items').dataset.items = section;
    var elemItems = document.querySelectorAll('.todo__items');
    for (let i = 0, length = elemItems.length; i < length; i++) {
      elemItems[i].classList.remove('updating');
      elemItems[i].classList.add('updating');
    }
  },
  save: function() {
    window.localStorage.setItem('todo', document.querySelector('.todo__items').innerHTML);
  },
  drag: function drag() {
    var _this = this;
    var elemItems = document.querySelector('.todo__items');
    elemItems.addEventListener('dragstart', function (e) {
      var target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      _this.dragging = target;
      window.setTimeout(function () {
        target.classList.add('d-none');
      }, 0);
    });
    elemItems.addEventListener('dragend', function (e) {
      var target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.remove('d-none');
      _this.save();
    });
    elemItems.addEventListener('dragover', function (e) {
      var target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      e.preventDefault();
    });
    elemItems.addEventListener('dragenter', function (e) {
      var target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.add('todo__item_dragenter');
    });
    elemItems.addEventListener('dragleave', function (e) {
      var target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.remove('todo__item_dragenter');
    });
    elemItems.addEventListener('drop', function (e) {
      var target = e.target;
      if (!target.classList.contains('todo__item')) {
        return;
      }
      target.classList.remove('todo__item_dragenter');
      target.after(_this.dragging);
      _this.dragging = null;
    });
  }
};
todo.init();
