class ItcAccordion {
  #el;
  #config;

  constructor(target, config) {
    this.#el = typeof target === 'string' ? document.querySelector(target) : target;
    const defaultConfig = {
      alwaysOpen: true
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
          elOpenItem !== elHeader.parentElement ? elOpenItem.classList.toggle('itc-accordion-item-show') : null;
        }
      }
      elHeader.parentElement.classList.toggle('itc-accordion-item-show');
    });
  }
}

export default ItcAccordion;
