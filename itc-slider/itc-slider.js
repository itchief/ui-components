/**
 * ItcSlider by itchief (https://github.com/itchief/ui-components/tree/master/itc-slider)
 * Copyright 2020 - 2022 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/ui-components/blob/master/LICENSE)
 */

class ItcSlider {
  static #WRAPPER = 'slider__wrapper';
  static #ITEMS = 'slider__items';
  static #ITEM = 'slider__item';
  static #INDICATORS = 'slider__indicators > li';

  static CLASS_CONTROL = 'slider__control';
  static CLASS_CONTROL_HIDE = 'slider__control_hide';
  static CLASS_ITEM_ACTIVE = 'slider__item_active';
  static CLASS_INDICATOR_ACTIVE = 'active';
  static SEL_PREV = '.slider__control[data-slide="prev"]';
  static SEL_NEXT = '.slider__control[data-slide="next"]';
  static TRANSITION_OFF = 'slider_disable-transition';

  static #instances = [];

  #el; // элемент который нужно активировать как ItcSlider
  #elWrapper; // элемент с классом #CLASS_WRAPPER
  #elItems; // элемент, в котором расположены слайды
  #elListItem; // список элементов, являющиеся слайдами
  #btnPrev; // кнопка, для перехода к предыдущему слайду
  #btnNext; // кнопка, для перехода к следующему слайду

  #exOrderMin;
  #exOrderMax;
  #exItemMin;
  #exItemMax;
  #exTranslateMin;
  #exTranslateMax;

  static getOrCreateInstance(target, config) {
    const elSlider = typeof target === 'string' ? document.querySelector(target) : target;
    const found = this.#instances.find(el => el.target === elSlider);
    if (found) {
      return found.instance;
    }
    const slider = new this(elSlider, config);
    this.#instances.push({target: elSlider, instance: slider});
    return this;
  }

  next() {
    this._direction = 'next';
    this.#move();
  }
  prev() {
    this._direction = 'prev';
    this.#move();
  }
  moveTo(index) {
    this.#moveTo(index);
  }
  reset() {
    this.#reset();
  }

  static contains = [];

  static createInstances() {
    document.querySelectorAll('[data-slider="itc-slider"]').forEach((el) => {
      if (this.contains.find((item) => item.el === el)) {
        return;
      }
      const dataset = el.dataset;
      const params = {};
      Object.keys(dataset).forEach((key) => {
        if (key === 'slider') {
          return;
        }
        let value = dataset[key];
        value = value === 'true' ? true : value;
        value = value === 'false' ? false : value;
        value = Number.isNaN(Number(value)) ? Number(value) : value;
        params[key] = value;
      });
      this.contains.push({ el, slider: new ItcSlider(el, params) });
      el.dataset.sliderId = String(this.contains.length);
      el.querySelectorAll('.slider__control').forEach((btn) => {
        btn.dataset.sliderTarget = String(this.contains.length);
      });
    });
  }

  constructor(selector, config) {
    this.#el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    this.#elWrapper = this.#el.querySelector(`.${this.constructor.#WRAPPER}`);
    this.#elItems = this.#el.querySelector(`.${this.constructor.#ITEMS}`);
    this.#elListItem = this.#el.querySelectorAll(`.${this.constructor.#ITEM}`);
    this.#btnPrev = this.#el.querySelector(ItcSlider.SEL_PREV);
    this.#btnNext = this.#el.querySelector(ItcSlider.SEL_NEXT);

    this.#exOrderMin = 0;
    this.#exOrderMax = 0;
    this.#exItemMin = null;
    this.#exItemMax = null;
    this.#exTranslateMin = 0;
    this.#exTranslateMax = 0;

    const styleElItems = window.getComputedStyle(this.#elItems);
    this._delay = Math.round(parseFloat(styleElItems.transitionDuration) * 50);

    this._direction = 'next';

    this._intervalId = null;

    this._isSwiping = false;
    this._swipeX = 0;

    this._config = {
      loop: true,
      autoplay: false,
      interval: 5000,
      refresh: true,
      swipe: true,
      ...config
    };

    this.#setInitialValues();
    this.#addEventListener();
  }

  #addEventListener() {
    this.#el.addEventListener('click', (e) => {
      this.#autoplay('stop');
      if (e.target.classList.contains(ItcSlider.CLASS_CONTROL)) {
        e.preventDefault();
        this._direction = e.target.dataset.slide;
        this.#move();
      } else if (e.target.dataset.slideTo) {
        const index = parseInt(e.target.dataset.slideTo, 10);
        this.#moveTo(index);
      }
      this._config.loop ? this.#autoplay() : null;
    });
    this.#el.addEventListener('mouseenter', () => {
      this.#autoplay('stop');
    });
    this.#el.addEventListener('mouseleave', () => {
      this.#autoplay();
    });
    if (this._config.refresh) {
      window.addEventListener('resize', () => {
        window.requestAnimationFrame(this.#reset.bind(this));
      });
    }
    if (this._config.loop) {
      this.#elItems.addEventListener('itcslider-start', () => {
        if (this._isBalancing) {
          return;
        }
        this._isBalancing = true;
        window.requestAnimationFrame(this.#balanceItems.bind(this));
      });
      this.#elItems.addEventListener('transitionend', () => {
        this._isBalancing = false;
      });
    }
    const onSwipeStart = (e) => {
      this.#autoplay('stop');
      const event = e.type.search('touch') === 0 ? e.touches[0] : e;
      this._swipeX = event.clientX;
      this._isSwiping = true;
    };
    const onSwipeEnd = (e) => {
      if (!this._isSwiping) {
        return;
      }
      const event = e.type.search('touch') === 0 ? e.changedTouches[0] : e;
      const diffPos = this._swipeX - event.clientX;
      if (diffPos > 50) {
        this._direction = 'next';
        this.#move();
      } else if (diffPos < -50) {
        this._direction = 'prev';
        this.#move();
      }
      this._isSwiping = false;
      if (this._config.loop) {
        this.#autoplay();
      }
    };
    if (this._config.swipe) {
      this.#el.addEventListener('touchstart', onSwipeStart);
      this.#el.addEventListener('mousedown', onSwipeStart);
      document.addEventListener('touchend', onSwipeEnd);
      document.addEventListener('mouseup', onSwipeEnd);
    }
    this.#el.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.#autoplay('stop');
      } else if (document.visibilityState === 'visible' && this._config.loop) {
        this.#autoplay();
      }
    });
  }

  #autoplay(action) {
    if (!this._config.autoplay) {
      return;
    }
    if (action === 'stop') {
      clearInterval(this._intervalId);
      this._intervalId = null;
      return;
    }
    if (this._intervalId === null) {
      this._intervalId = setInterval(() => {
        this._direction = 'next';
        this.#move();
      }, this._config.interval);
    }
  }

  #balanceItems() {
    if (!this._isBalancing) {
      return;
    }
    const wrapperRect = this.#elWrapper.getBoundingClientRect();
    const targetWidth = wrapperRect.width / this._countActiveItems / 2;
    const countItems = this.#elListItem.length;
    if (this._direction === 'next') {
      const exItemRectRight = this.#exItemMin.getBoundingClientRect().right;
      if (exItemRectRight < wrapperRect.left - targetWidth) {
        this.#exItemMin.dataset.order = String(this.#exOrderMin + countItems);
        const translate = this.#exTranslateMin + countItems * this._widthItem;
        this.#exItemMin.dataset.translate = String(translate);
        this.#exItemMin.style.transform = `translate3D(${translate}px, 0px, 0.1px)`;
        this.#updateExProperties();
      }
    } else {
      const exItemRectLeft = this.#exItemMax.getBoundingClientRect().left;
      if (exItemRectLeft > wrapperRect.right + targetWidth) {
        this.#exItemMax.dataset.order = String(this.#exOrderMax - countItems);
        const translate = this.#exTranslateMax - countItems * this._widthItem;
        this.#exItemMax.dataset.translate = String(translate);
        this.#exItemMax.style.transform = `translate3D(${translate}px, 0px, 0.1px)`;
        this.#updateExProperties();
      }
    }
    window.setTimeout(() => {
      window.requestAnimationFrame(this.#balanceItems.bind(this));
    }, this._delay);
  }

  #changeActiveItems() {
    this._stateItems.forEach((item, index) => {
      if (item) {
        this.#elListItem[index].classList.add(ItcSlider.CLASS_ITEM_ACTIVE);
      } else {
        this.#elListItem[index].classList.remove(ItcSlider.CLASS_ITEM_ACTIVE);
      }
      const elListIndicators = this.#el.querySelectorAll(`.${this.constructor.#INDICATORS}`);
      if (elListIndicators.length && item) {
        elListIndicators[index].classList.add(ItcSlider.CLASS_INDICATOR_ACTIVE);
      } else if (elListIndicators.length && !item) {
        elListIndicators[index].classList.remove(ItcSlider.CLASS_INDICATOR_ACTIVE);
      }
    });
  }

  #move() {
    const widthItem = this._direction === 'next' ? -this._widthItem : this._widthItem;
    const transform = this._transform + widthItem;
    if (!this._config.loop) {
      const limit = this._widthItem * (this.#elListItem.length - this._countActiveItems);
      if (transform < -limit || transform > 0) {
        return;
      }
      if (this.#btnPrev) {
        this.#btnPrev.classList.remove(ItcSlider.CLASS_CONTROL_HIDE);
        this.#btnNext.classList.remove(ItcSlider.CLASS_CONTROL_HIDE);
      }
      if (this.#btnPrev && transform === -limit) {
        this.#btnNext.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
      } else if (this.#btnPrev && transform === 0) {
        this.#btnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
      }
    }
    if (this._direction === 'next') {
      this._stateItems = [...this._stateItems.slice(-1), ...this._stateItems.slice(0, -1)];
    } else {
      this._stateItems = [...this._stateItems.slice(1), ...this._stateItems.slice(0, 1)];
    }
    this.#changeActiveItems();
    this._transform = transform;
    this.#elItems.style.transform = `translate3D(${transform}px, 0px, 0.1px)`;
    this.#elItems.dispatchEvent(new CustomEvent('itcslider-start', {
      bubbles: true
    }));
  }

  #moveTo(index) {
    const delta = this._stateItems.reduce((acc, current, currentIndex) => {
      const diff = current ? index - currentIndex : acc;
      return Math.abs(diff) < Math.abs(acc) ? diff : acc;
    }, this._stateItems.length);
    if (delta !== 0) {
      this._direction = delta > 0 ? 'next' : 'prev';
      for (let i = 0; i < Math.abs(delta); i++) {
        this.#move();
      }
    }
  }

  #setInitialValues() {
    this._transform = 0;
    this._stateItems = [];
    this._isBalancing = false;
    this._widthItem = this.#elListItem[0].getBoundingClientRect().width;
    this._widthWrapper = this.#elWrapper.getBoundingClientRect().width;
    this._countActiveItems = Math.round(this._widthWrapper / this._widthItem);
    this.#elListItem.forEach((el, index) => {
      el.dataset.index = String(index);
      el.dataset.order = String(index);
      el.dataset.translate = '0';
      el.style.transform = '';
      this._stateItems.push(index < this._countActiveItems ? 1 : 0);
    });
    if (this._config.loop) {
      const lastIndex = this.#elListItem.length - 1;
      const translate = -(lastIndex + 1) * this._widthItem;
      this.#elListItem[lastIndex].dataset.order = '-1';
      this.#elListItem[lastIndex].dataset.translate = String(translate);
      this.#elListItem[lastIndex].style.transform = `translate3D(${translate}px, 0px, 0.1px)`;
      this.#updateExProperties();
    } else if (this.#btnPrev) {
      this.#btnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
    }
    this.#changeActiveItems();
    this.#autoplay();
  }

  #reset() {
    const widthItem = this.#elListItem[0].getBoundingClientRect().width;
    const widthWrapper = this.#elWrapper.getBoundingClientRect().width;
    const countActiveEls = Math.round(widthWrapper / widthItem);
    if (widthItem === this._widthItem && countActiveEls === this._countActiveItems) {
      return;
    }
    this.#autoplay('stop');
    this.#elItems.classList.add(ItcSlider.TRANSITION_OFF);
    this.#elItems.style.transform = 'translate3D(0px, 0px, 0.1px)';
    this.#setInitialValues();
    window.requestAnimationFrame(() => {
      this.#elItems.classList.remove(ItcSlider.TRANSITION_OFF);
    });
  }

  #updateExProperties() {
    const els = Object.values(this.#elListItem).map((el) => el);
    const orders = els.map((item) => Number(item.dataset.order));
    this.#exOrderMin = Math.min(...orders);
    this.#exOrderMax = Math.max(...orders);
    const min = orders.indexOf(this.#exOrderMin);
    const max = orders.indexOf(this.#exOrderMax);
    this.#exItemMin = els[min];
    this.#exItemMax = els[max];
    this.#exTranslateMin = Number(this.#exItemMin.dataset.translate);
    this.#exTranslateMax = Number(this.#exItemMax.dataset.translate);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ItcSlider.createInstances();
});
