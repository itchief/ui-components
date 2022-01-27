class ItcMoveEl {
  constructor() {
    this._els = document.querySelectorAll('[data-move-el]');
    this._data = [];
    this._init();
  }
  _init() {
    this._els.forEach((el, index) => {
      this._data[index] = {
        el: el,
        parent: el.parentElement,
        position: [...el.parentElement.children].indexOf(el),
        moves: JSON.parse(el.dataset.moveEl.replaceAll('\'', '"')),
        state: -1
      }
    });
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect['width'];
      this._data.forEach(item => {
        item['moves'].forEach((breakpoint, index) => {
          let state = item['state'];
          if (width >= breakpoint['bp-min']) {
            state = index;
          } else if (width < breakpoint['bp-max']) {
            state = index;
          } else {
            state = -1;
          }
          if (item['state'] !== state) {
            item['state'] = state;
            this._move(item);
          }
        });
      });
    });
    resizeObserver.observe(document.body);
  }
  _move(item) {
    const el = item['el'];
    if (item['state'] > -1) {
      const target = document.querySelector(item['moves'][item['state']]['target']);
      target.children[item['moves'][item['state']]['index']].before(el);
    }
  }
}
