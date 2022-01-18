class ItcTabs {
  constructor(target, config) {
    const defaultConfig = {};
    this._config = Object.assign(defaultConfig, config);
    this._elTabs = typeof target === 'string' ? document.querySelector(target) : target;
    this._elLinks = this._elTabs.querySelectorAll('.tabs__link');
    this._elPanes = this._elTabs.querySelectorAll('.tabs__pane');
    this._eventShow = new Event('tab.itc.show');
    this._events();
  }
  show(elLinkTarget) {
    const href = elLinkTarget.getAttribute('href');
    const elPaneTarget = document.querySelector(href);
    const elLinkActive = this._elTabs.querySelector('.tabs__link_active');
    const elPaneShow = this._elTabs.querySelector('.tabs__pane_show');
    if (elLinkTarget === elLinkActive) {
      return;
    }
    elLinkActive ? elLinkActive.classList.remove('tabs__link_active') : null;
    elPaneShow ? elPaneShow.classList.remove('tabs__pane_show') : null;
    elLinkTarget.classList.add('tabs__link_active');
    elPaneTarget.classList.add('tabs__pane_show');
    this._elTabs.dispatchEvent(this._eventShow);
  }
  showByIndex(index) {
    const elLinkTarget = this._elLinks[index];
    elLinkTarget ? this.show(elLinkTarget) : null;
  };
  _events() {
    this._elTabs.addEventListener('click', (e) => {
      const target = e.target.closest('.tabs__link');
      if (target) {
        e.preventDefault();
        this.show(target);
      }
    });
  }
}
