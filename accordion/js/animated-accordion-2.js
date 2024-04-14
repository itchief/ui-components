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
    this.#el.querySelectorAll('.itc-accordion-body').forEach((element) => {
      element.style.transition = `max-height ${this.#config.duration}ms ease-out`;
    });
    this.addEventListener();
  }

  toggle(el) {
    el.classList.toggle('itc-accordion-item-show');
    const accordionBody = el.querySelector('.itc-accordion-body');
    if (accordionBody.style.maxHeight) {
      accordionBody.style.maxHeight = null;
    } else {
      accordionBody.style.maxHeight = `${accordionBody.scrollHeight}px`;
    }
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
}

export default ItcAccordion;
