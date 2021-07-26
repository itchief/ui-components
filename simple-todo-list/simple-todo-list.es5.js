'use strict';

// polyfill closest
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
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

// polyfill remove
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

var todo = {
  action: function action(e) {
    var target = e.target;
    if (target.classList.contains("todo__action")) {
      var action = target.dataset.todoAction;
      var elemItem = target.closest(".todo__item");
      if (action === "deleted" && elemItem.dataset.todoState === "deleted") {
        elemItem.remove();
      } else {
        elemItem.dataset.todoState = action;
      }
      this.save();
    } else if (target.classList.contains("todo__add")) {
      this.add();
      this.save();
    }
  },
  add: function add() {
    var elemText = document.querySelector(".todo__text");
    if (elemText.disabled || !elemText.value.length) {
      return;
    }
    document.querySelector(".todo__items").insertAdjacentHTML("beforeend", this.create(elemText.value));
    elemText.value = "";
  },
  create: function create(text) {
    return '<li class="todo__item" data-todo-state="active"><span class="todo__task">'.concat(
      text, '</span><span class="todo__action todo__action_restore" data-todo-action="active"></span><span class="todo__action todo__action_complete" data-todo-action="completed"></span><span class="todo__action todo__action_delete" data-todo-action="deleted"></span></li>');
  },
  init: function() {
    var fromStorage = localStorage.getItem("todo");
    if (fromStorage) {
      document.querySelector(".todo__items").innerHTML = fromStorage;
    }
    document.querySelector(".todo__options").addEventListener("change", this.update);
    document.addEventListener("click", this.action.bind(this));
  },
  update: function() {
    var option = document.querySelector(".todo__options").value;
    document.querySelector(".todo__items").dataset.todoOption = option;
    document.querySelector(".todo__text").disabled = option !== "active";
  },
  save: function() {
    localStorage.setItem(
      "todo",
      document.querySelector(".todo__items").innerHTML
    );
  }
};

todo.init();
