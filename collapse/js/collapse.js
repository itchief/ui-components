class ItcCollapse {
  constructor(target, duration = 350) {
    this._target = target;
    this._duration = duration;
  }
  show() {
    const el = this._target;
    if (el.classList.contains('collapsing') || el.classList.contains('show')) {
      return;
    }
    el.classList.remove('collapse');
    const height = el.offsetHeight;
    el.style['height'] = 0;
    el.style['overflow'] = 'hidden';
    el.classList.add('collapsing');
    el.offsetHeight;
    el.style['height'] = `${height}px`;
    el.style['transition'] = `height ${this._duration}ms ease`;
    window.setTimeout(() => {
      el.style['height'] = '';
      el.style['transition'] = '';
      el.style['overflow'] = '';
      el.classList.remove('collapsing');
      el.classList.add('collapse');
      el.classList.add('show');
    }, this._duration);
  }
  hide() {
    const el = this._target;
    if (el.classList.contains('collapsing') || !el.classList.contains('show')) {
      return;
    }
    el.style['height'] = `${el.offsetHeight}px`;
    el.style['transition'] = `height ${this._duration}ms ease`;
    el.offsetHeight;
    el.style['height'] = 0;
    el.style['overflow'] = 'hidden';
    el.classList.remove('collapse');
    el.classList.remove('show');
    el.classList.add('collapsing');
    window.setTimeout(() => {
      el.style['height'] = '';
      el.style['transition'] = '';
      el.style['overflow'] = '';
      el.classList.remove('collapsing');
      el.classList.add('collapse');
    }, this._duration);
  }
  toggle() {
    this._target.classList.contains('show') ? this.hide() : this.show();
  }
}
