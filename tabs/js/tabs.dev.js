class ItcTabs {
  constructor(target, config) {
    const defaultConfig = {};
    this._config = Object.assign(defaultConfig, config);
    this._elTabs = typeof target === 'string' ? document.querySelector(target) : target;

    this._elButtons = [];
    this._elPanes = [];
    [...this._elTabs.children].forEach(el => {
      [...el.children].forEach(el => {
        if (el.classList.contains('tabs__btn')) {
          this._elButtons.push(el);
        } else if (el.classList.contains('tabs__pane')) {
          this._elPanes.push(el);
        }
      })
    });
    this._eventShow = new Event('tab.itc.change');
    this._init();
    this._events();
  }
  _init() {
    this._elTabs.setAttribute('role', 'tablist');
    this._elButtons.forEach((el, index) => {
      el.dataset.index = index;
      el.setAttribute('role', 'tab');
      this._elPanes[index].setAttribute('role', 'tabpanel');
    });
  }
  show(elLinkTarget) {
    const elPaneTarget = this._elPanes[this._elButtons.indexOf(elLinkTarget)];
    let elLinkActive = null;
    let elPaneShow = null;
    this._elButtons.forEach(el => {
      if (el.classList.contains('tabs__btn_active')) {
        elLinkActive = el;
      }
    })
    this._elPanes.forEach(el => {
      if (el.classList.contains('tabs__pane_show')) {
        elPaneShow = el;
      }
    })
    if (elLinkTarget === elLinkActive) {
      return;
    }
    elLinkActive ? elLinkActive.classList.remove('tabs__btn_active') : null;
    elPaneShow ? elPaneShow.classList.remove('tabs__pane_show') : null;
    elLinkTarget.classList.add('tabs__btn_active');
    elPaneTarget.classList.add('tabs__pane_show');
    this._elTabs.dispatchEvent(this._eventShow);
    elLinkTarget.focus();
  }
  showByIndex(index) {
    const elLinkTarget = this._elButtons[index];
    elLinkTarget ? this.show(elLinkTarget) : null;
  };
  _events() {
    this._elTabs.addEventListener('click', (e) => {
      const target = e.target.closest('.tabs__btn');
      if (this._elButtons.includes(target)) {
        e.preventDefault();
        this.show(target);
      }
    });
  }
}
