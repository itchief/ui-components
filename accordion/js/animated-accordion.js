class ItcAccordion {
  #el;
  #config;

  constructor(target, config) {
    this.#el = typeof target === 'string' ? document.querySelector(target) : target;
    const defaultConfig = {
      alwaysOpen: true,
      duration: 350
    };
    this.#config = Object.assign(defaultConfig, config);
    this.addEventListener();
  }
  addEventListener() {
    this.#el.addEventListener('click', (e) => {
      const elHeader = e.target.closest('.itc-accordion-header');
      if (!elHeader) {
        return;
      }
      if (!this.#config.alwaysOpen) {
        const elOpenItem = this.#el.querySelector('.itc-accordion-item-show');
        if (elOpenItem) {
          elOpenItem !== elHeader.parentElement ? this.toggle(elOpenItem) : null;
        }
      }
      this.toggle(elHeader.parentElement);
    });
  }
  show(el) {
    const elBody = el.querySelector('.itc-accordion-body');
    if (elBody.classList.contains('collapsing') || el.classList.contains('itc-accordion-item-show')) {
      return;
    }
    elBody.style.display = 'block';
    const height = elBody.offsetHeight;
    elBody.style.height = 0;
    elBody.style.overflow = 'hidden';
    elBody.style.transition = `height ${this.#config.duration}ms ease`;
    elBody.classList.add('collapsing');
    el.classList.add('itc-accordion-item-slidedown');
    elBody.offsetHeight;
    elBody.style.height = `${height}px`;
    window.setTimeout(() => {
      elBody.classList.remove('collapsing');
      el.classList.remove('itc-accordion-item-slidedown');
      elBody.classList.add('collapse');
      el.classList.add('itc-accordion-item-show');
      elBody.style.display = '';
      elBody.style.height = '';
      elBody.style.transition = '';
      elBody.style.overflow = '';
    }, this.#config.duration);
  }
  hide(el) {
    const elBody = el.querySelector('.itc-accordion-body');
    if (elBody.classList.contains('collapsing') || !el.classList.contains('itc-accordion-item-show')) {
      return;
    }
    elBody.style.height = `${elBody.offsetHeight}px`;
    elBody.offsetHeight;
    elBody.style.display = 'block';
    elBody.style.height = 0;
    elBody.style.overflow = 'hidden';
    elBody.style.transition = `height ${this.#config.duration}ms ease`;
    elBody.classList.remove('collapse');
    el.classList.remove('itc-accordion-item-show');
    elBody.classList.add('collapsing');
    window.setTimeout(() => {
      elBody.classList.remove('collapsing');
      elBody.classList.add('collapse');
      elBody.style.display = '';
      elBody.style.height = '';
      elBody.style.transition = '';
      elBody.style.overflow = '';
    }, this.#config.duration);
  }
  toggle(el) {
    el.classList.contains('itc-accordion-item-show') ? this.hide(el) : this.show(el);
  }
}

export default ItcAccordion;
