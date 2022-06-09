class ItcMoveEl {
  constructor() {
    this._els = document.querySelectorAll('[data-move-el]');
    this._data = [];
    this._init();
  }
  _init() {
    this._els.forEach((el, index) => {
      this._data[index] = {
        el,
        parent: el.parentElement,
        position: [...el.parentElement.children].indexOf(el),
        moves: JSON.parse(el.dataset.moveEl.replaceAll('\'', '"')),
        state: -1
      };
    });
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      this._data.forEach((item) => {
        let newState = item.state;
        let minWidth = 0;
        let maxWidth = 0;
        let isChange = false;
        item.moves.forEach((breakpoint, index) => {
          const bpMin = breakpoint['bp-min'];
          const bpMax = breakpoint['bp-max'];
          if (width >= bpMin && bpMax === undefined && bpMin >= minWidth) {
            newState = index;
            minWidth = bpMin;
            isChange = true;
          } else if (bpMin === undefined && width < bpMax && (bpMax <= maxWidth || maxWidth === 0)) {
            newState = index;
            maxWidth = bpMax;
            isChange = true;
          } else if (width >= bpMin && width < bpMax) {
            newState = index;
            minWidth = bpMin;
            maxWidth = bpMax;
            isChange = true;
          }
        });
        newState = isChange ? newState : -1;
        if (item.state !== newState) {
          item.state = newState;
          this._move(item);
        }
      });
    });
    resizeObserver.observe(document.body);
  }
  _move(item) {
    const el = item['el'];
    const state = item['state'];
    const position = state > -1 ? item['moves'][state]['index'] : item['position'];
    const target = state > -1 ? document.querySelector(item['moves'][state]['target']) : item['parent'];
    position >= target.children.length ? target.append(el) : target.children[position].before(el);
  }
}
