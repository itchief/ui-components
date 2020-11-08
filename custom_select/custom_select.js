(function () {
  if (typeof window.CustomEvent === 'function') return false;
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  window.CustomEvent = CustomEvent;
})();

const templateSelect = (data = [], defaultText = 'Выберите из списка') => {
  let items = [];
  data.forEach(item => {
    let classItemSelected = '';
    if (item === defaultText) {
      classItemSelected = ' select__item_selected';
    }
    items.push(`<li class="select__item${classItemSelected}" data-select="item">${item}</li>`);
  });
  return `
  <div class="select__backdrop" data-select="backdrop"></div>
  <button type="button" class="select__trigger" data-select="trigger">
    ${defaultText}
  </button>
  <div class="select__dropdown">
    <ul class="select__items">
      ${items.join('')}
    </ul>
  </div>`;
};

class CustomSelect {
  constructor(selector, config) {
    this._$main = document.querySelector(selector);
    this._config = config || {};
    if (this._config.data) {
      this._render();
    }
    this._$trigger = this._$main.querySelector('[data-select="trigger"]');
    this._addEventListener();
  }
  _isShow() {
    return this._$main.classList.contains('select_show');
  }
  _changeItem(item) {
    if (!item.classList.contains('select__item_selected')) {
      const itemSelected = this._$main.querySelector('.select__item_selected');
      if (itemSelected) {
        itemSelected.classList.remove('select__item_selected');
      }
      item.classList.add('select__item_selected');
      this._$trigger.textContent = item.textContent;
      this._$main.dispatchEvent(this._changeValue);
      this._config.onSelected ? this._config.onSelected(item) : null;
    }
  }
  _eventHandler(e) {
    let $target = e.target;
    let type = $target.dataset.select;
    if (!type) {
      $target = $target.closest('[data-select]');
      type = $target.dataset.select;
    }
    if (type === 'trigger') {
      this.toggle();
    } else if (type === 'item') {
      this._changeItem($target);
      this.hide();
    } else if (type === 'backdrop') {
      // закрываем селект, если кликнули вне его
      this.hide();
    }
  }
  _addEventListener() {
    // привяжем функцию _eventHandler к контексту this
    this._eventHandler = this._eventHandler.bind(this);
    // добавим слушатель
    this._$main.addEventListener('click', this._eventHandler);
    this._changeValue = new CustomEvent('select.change');
  }
  _render() {
    // добавляем класс select, если его нет у базового элемента
    if (!this._$main.classList.contains('select')) {
      this._$main.classList.add('select');
    }
    this._$main.innerHTML = templateSelect(this._config['data'], this._config['defaultValue']);
  }
  show() {
    this._$main.classList.add('select_show');
  }
  hide() {
    this._$main.classList.remove('select_show');
  }
  toggle() {
    this._isShow() ? this.hide() : this.show();
  }
  // удаляем слушатели и данный селект из DOM
  destroy() {
    this._$main.removeEventListener('click', this._eventHandler);
    this._$main.innerHTML = '';
  }
  selectedItem(value) {
    if (typeof value === 'object') {
      if (value['value']) {
        this._$main.querySelectorAll('[data-select="item"]').forEach($item => {
          if ($item.textContent.trim() === value['value'].toString()) {
            this._changeItem($item);
            return;
          }
        });
      } else if (value['index'] >= 0) {
        const $item = this._$main.querySelectorAll('[data-select="item"]')[value['index']];
        this._changeItem($item);
      }
      return this.selectedItem();
    }
    let indexSelected = -1;
    let valueSelected = '';
    this._$main.querySelectorAll('[data-select="item"]').forEach(($element, index) => {
      if ($element.classList.contains('select__item_selected')) {
        indexSelected = index;
        valueSelected = $element.textContent;
      }
    });
    return { index: indexSelected, value: valueSelected };
  }
}
