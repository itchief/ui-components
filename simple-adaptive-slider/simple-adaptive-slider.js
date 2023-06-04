/* eslint-disable no-param-reassign,getter-return */
// noinspection DuplicatedCode

/**
 * SimpleAdaptiveSlider by itchief (https://github.com/itchief/ui-components/tree/master/simple-adaptive-slider)
 * Copyright 2020 - 2023 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/ui-components/blob/master/LICENSE)
 */

class ItcSimpleSlider {
  // базовые классы и селекторы
  static PREFIX = 'itcss';
  static EL_WRAPPER = `${ItcSimpleSlider.PREFIX}__wrapper`;
  static EL_ITEM = `${ItcSimpleSlider.PREFIX}__item`;
  static EL_ITEM_ACTIVE = `${ItcSimpleSlider.PREFIX}__item_active`;
  static EL_ITEMS = `${ItcSimpleSlider.PREFIX}__items`;
  static EL_INDICATOR = `${ItcSimpleSlider.PREFIX}__indicator`;
  static EL_INDICATOR_ACTIVE = `${ItcSimpleSlider.PREFIX}__indicator_active`;
  static EL_INDICATORS = `${ItcSimpleSlider.PREFIX}__indicators`;
  static EL_CONTROL = `${ItcSimpleSlider.PREFIX}__btn`;
  // порог для переключения слайда (20%)
  static SWIPE_THRESHOLD = 20;
  // класс для отключения transition
  static TRANSITION_NONE = 'transition-none';
  // Определите, поддерживает ли текущий клиент пассивные события
  static checkSupportPassiveEvents() {
    let passiveSupported = false;
    try {
      const options = Object.defineProperty({}, 'passive', {
        get() {
          passiveSupported = true;
        },
      });
      window.addEventListener('testPassiveListener', null, options);
      window.removeEventListener('testPassiveListener', null, options);
    } catch (error) {
      passiveSupported = false;
    }
    return passiveSupported;
  }

  constructor(target, config) {
    this._el = typeof target === 'string' ? document.querySelector(target) : target;
    this._elWrapper = this._el.querySelector(`.${this.constructor.EL_WRAPPER}`);
    this._elItems = this._el.querySelector(`.${this.constructor.EL_ITEMS}`);
    this._elListItem = this._el.querySelectorAll(`.${this.constructor.EL_ITEM}`);

    // экстремальные значения слайдов
    this._exOrderMin = 0;
    this._exOrderMax = 0;
    this._exItemMin = null;
    this._exItemMax = null;
    this._exTranslateMin = 0;
    this._exTranslateMax = 0;

    this._states = [];

    this._isBalancing = false;

    // направление смены слайдов (по умолчанию)
    this._direction = 'next';
    // текущее значение трансформации
    this._transform = 0;

    this._clientRect = this._elWrapper.getBoundingClientRect();

    this._supportResizeObserver = typeof window.ResizeObserver !== 'undefined';

    const styleElItems = window.getComputedStyle(this._elItems);
    this._delay = Math.round(parseFloat(styleElItems.transitionDuration) * 50);

    // swipe параметры
    this._hasSwipeState = false;
    this._swipeStartPosX = 0;
    // id таймера
    this._intervalId = null;
    this._config = {
      loop: true,
      autoplay: false,
      interval: 5000,
      indicators: true,
      swipe: true,
      ...config
    };
    this._elItems.dataset.translate = '0';
    // добавляем к слайдам data-атрибуты
    this._elListItem.forEach((item, index) => {
      item.dataset.order = `${index}`;
      item.dataset.index = `${index}`;
      item.dataset.translate = '0';
      this._states.push(index === 0 ? 1 : 0);
    });

    // перемещаем последний слайд перед первым
    if (this._config.loop) {
      const count = this._elListItem.length - 1;
      const translate = -this._elListItem.length;
      this._elListItem[count].dataset.order = '-1';
      this._elListItem[count].dataset.translate = `${-this._elListItem.length}`;
      const valueX = translate * this._clientRect.width;
      this._elListItem[count].style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
    }
    // добавляем индикаторы к слайдеру
    this._addIndicators();
    this._elListIndicator = document.querySelectorAll(`.${this.constructor.EL_INDICATOR}`);
    // обновляем экстремальные значения переменных
    this._updateExProperties();
    // помечаем активные элементы
    this._changeActiveItems();
    // назначаем обработчики
    this._addEventListener();
    // запускаем автоматическую смену слайдов
    this._autoplay();
  }

  _changeActiveItems() {
    this._states.forEach((item, index) => {
      if (item) {
        this._elListItem[index].classList.add(this.constructor.EL_ITEM_ACTIVE);
      } else {
        this._elListItem[index].classList.remove(this.constructor.EL_ITEM_ACTIVE);
      }
      if (this._elListIndicator.length && item) {
        this._elListIndicator[index].classList.add(this.constructor.EL_INDICATOR_ACTIVE);
      } else if (this._elListIndicator.length && !item) {
        this._elListIndicator[index].classList.remove(this.constructor.EL_INDICATOR_ACTIVE);
      }
    });
    this._el.dispatchEvent(new CustomEvent('change.itc.slider', { bubbles: true }));
  }

  // смена слайдов
  _move() {
    this._elItems.classList.remove(this.constructor.TRANSITION_NONE);
    if (this._direction === 'none') {
      const valueX = this._transform * this._clientRect.width;
      this._elItems.style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
      return;
    }
    if (!this._config.loop) {
      const isNotMovePrev = this._states[0] && this._direction === 'prev';
      const isNotMoveNext = this._states[this._states.length - 1] && this._direction === 'next';
      if (isNotMovePrev || isNotMoveNext) {
        this._autoplay('stop');
        return;
      }
    }
    this._transform += this._direction === 'next' ? -1 : 1;
    if (this._direction === 'next') {
      this._states = [...this._states.slice(-1), ...this._states.slice(0, -1)];
    } else if (this._direction === 'prev') {
      this._states = [...this._states.slice(1), ...this._states.slice(0, 1)];
    }
    this._elItems.dataset.translate = this._transform;
    const valueX = this._transform * this._clientRect.width;
    this._elItems.style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
    this._elItems.dispatchEvent(new CustomEvent('moving.itc.slider', { bubbles: true }));
    this._changeActiveItems();
    if (!this._isBalancing) {
      this._isBalancing = true;
      window.requestAnimationFrame(this._balanceItems.bind(this));
    }
  }

  // функция для перемещения к слайду по индексу
  _moveTo(index) {
    const currIndex = this._states.indexOf(1);
    this._direction = index > currIndex ? 'next' : 'prev';
    for (let i = 0; i < Math.abs(index - currIndex); i++) {
      this._move();
    }
  }

  // метод для автоматической смены слайдов
  _autoplay(action) {
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
        this._move();
      }, this._config.interval);
    }
  }

  // добавление индикаторов
  _addIndicators() {
    const el = this._el.querySelector(`.${this.constructor.EL_INDICATORS}`);
    if (el || !this._config.indicators) {
      return;
    }
    let rows = '';
    for (let i = 0, { length } = this._elListItem; i < length; i++) {
      rows += `<li class="${this.constructor.EL_INDICATOR}" data-slide-to="${i}"></li>`;
    }
    const html = `<ol class="${this.constructor.EL_INDICATORS}">${rows}</ol>`;
    this._el.insertAdjacentHTML('beforeend', html);
  }

  // refresh extreme values
  _updateExProperties() {
    const els = Object.values(this._elListItem).map((el) => el);
    const orders = els.map((item) => Number(item.dataset.order));
    this._exOrderMin = Math.min(...orders);
    this._exOrderMax = Math.max(...orders);
    const min = orders.indexOf(this._exOrderMin);
    const max = orders.indexOf(this._exOrderMax);
    this._exItemMin = els[min];
    this._exItemMax = els[max];
    this._exTranslateMin = Number(this._exItemMin.dataset.translate);
    this._exTranslateMax = Number(this._exItemMax.dataset.translate);
  }

  _balanceItems() {
    if (!this._isBalancing) {
      return;
    }
    if (this._direction === 'next') {
      const exItemRight = this._exItemMin.getBoundingClientRect().right;
      if (exItemRight < this._clientRect.left - this._clientRect.width / 2) {
        this._exItemMin.dataset.order = `${this._exOrderMin + this._elListItem.length}`;
        this._exItemMin.dataset.translate = `${this._exTranslateMin + this._elListItem.length}`;
        const valueX = (this._exTranslateMin + this._elListItem.length) * this._clientRect.width;
        this._exItemMin.style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
        this._updateExProperties();
      }
    } else {
      const exItemLeft = this._exItemMax.getBoundingClientRect().left;
      if (exItemLeft > this._clientRect.right + this._clientRect.width / 2) {
        this._exItemMax.dataset.order = `${this._exOrderMax - this._elListItem.length}`;
        this._exItemMax.dataset.translate = `${this._exTranslateMax - this._elListItem.length}`;
        const valueX = (this._exTranslateMax - this._elListItem.length) * this._clientRect.width;
        this._exItemMax.style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
        this._updateExProperties();
      }
    }
    window.setTimeout(() => {
      window.requestAnimationFrame(this._balanceItems.bind(this));
    }, this._delay);
  }

  // adding listeners
  _addEventListener() {
    const onSwipeStart = (e) => {
      this._autoplay('stop');
      if (e.target.closest(`.${this.constructor.EL_CONTROL}`)) {
        return;
      }
      const event = e.type.search('touch') === 0 ? e.touches[0] : e;
      this._swipeStartPosX = event.clientX;
      this._swipeStartPosY = event.clientY;
      this._hasSwipeState = true;
      this._hasSwiping = false;
    };
    const onSwipeMove = (e) => {
      if (!this._hasSwipeState) {
        return;
      }
      const event = e.type.search('touch') === 0 ? e.touches[0] : e;
      let diffPosX = this._swipeStartPosX - event.clientX;
      const diffPosY = this._swipeStartPosY - event.clientY;
      if (!this._hasSwiping) {
        if (Math.abs(diffPosY) > Math.abs(diffPosX) || Math.abs(diffPosX) === 0) {
          this._hasSwipeState = false;
          return;
        }
        this._hasSwiping = true;
      }
      e.preventDefault();
      if (!this._config.loop) {
        const isNotMoveFirst = this._states[0] && diffPosX <= 0;
        const isNotMoveLast = this._states[this._states.length - 1] && diffPosX >= 0;
        if (isNotMoveFirst || isNotMoveLast) {
          diffPosX /= 4;
        }
      }
      this._elItems.classList.add(this.constructor.TRANSITION_NONE);
      const valueX = this._transform * this._clientRect.width - diffPosX;
      this._elItems.style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
    };
    const onSwipeEnd = (e) => {
      if (!this._hasSwipeState) {
        return;
      }
      const event = e.type.search('touch') === 0 ? e.changedTouches[0] : e;
      let diffPosX = this._swipeStartPosX - event.clientX;
      if (diffPosX === 0) {
        this._hasSwipeState = false;
        return;
      }
      if (!this._config.loop) {
        const isNotMoveFirst = this._states[0] && diffPosX <= 0;
        const isNotMoveLast = this._states[this._states.length - 1] && diffPosX >= 0;
        if (isNotMoveFirst || isNotMoveLast) {
          diffPosX = 0;
        }
      }
      const value = (diffPosX / this._clientRect.width) * 100;
      this._elItems.classList.remove(this.constructor.TRANSITION_NONE);
      if (value > this.constructor.SWIPE_THRESHOLD) {
        this._direction = 'next';
        this._move();
      } else if (value < -this.constructor.SWIPE_THRESHOLD) {
        this._direction = 'prev';
        this._move();
      } else {
        this._direction = 'none';
        this._move();
      }
      this._hasSwipeState = false;
      this._autoplay();
    };
    // click
    this._el.addEventListener('click', (e) => {
      const $target = e.target;
      this._autoplay('stop');
      if ($target.classList.contains(this.constructor.EL_CONTROL)) {
        e.preventDefault();
        this._direction = $target.dataset.slide;
        this._move();
      } else if ($target.dataset.slideTo) {
        e.preventDefault();
        const index = parseInt($target.dataset.slideTo, 10);
        this._moveTo(index);
      }
      this._autoplay();
    });

    // transitionstart and transitionend
    if (this._config.loop) {
      this._elItems.addEventListener('transitionend', () => {
        this._isBalancing = false;
      });
    }
    // mouseenter and mouseleave
    this._el.addEventListener('mouseenter', () => {
      this._autoplay('stop');
    });
    this._el.addEventListener('mouseleave', () => {
      this._autoplay();
    });
    // swipe
    if (this._config.swipe) {
      const options = this.constructor.checkSupportPassiveEvents() ? { passive: false } : false;
      this._el.addEventListener('touchstart', onSwipeStart, options);
      this._el.addEventListener('touchmove', onSwipeMove, options);
      this._el.addEventListener('mousedown', onSwipeStart);
      this._el.addEventListener('mousemove', onSwipeMove);
      document.addEventListener('touchend', onSwipeEnd);
      document.addEventListener('mouseup', onSwipeEnd);
      document.addEventListener('mouseout', onSwipeEnd);
    }
    this._el.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
    // при изменении активности вкладки
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this._config.loop) {
        this._autoplay();
      } else {
        this._autoplay('stop');
      }
    });
    if (this._supportResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        const { contentRect } = entries[0];
        if (Math.round(this._clientRect.width * 10) === Math.round(contentRect.width * 10)) {
          return;
        }
        this._clientRect = contentRect;
        const newValueX = contentRect.width * Number(this._elItems.dataset.translate);
        this.reset(newValueX, true);
        this._autoplay();
      });
      resizeObserver.observe(this._elWrapper);
    }
  }

  reset(newValueX = 0, recalc = false) {
    this._autoplay('stop');
    this._elItems.classList.add(this.constructor.TRANSITION_NONE);
    this._elItems.style.transform = `translate3D(${newValueX}px, 0px, 0.1px)`;
    this._elListItem.forEach((el) => {
      const valueX = recalc ? Number(el.dataset.translate) * this._clientRect.width : 0;
      el.style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
    });
    if (!recalc) {
      this._transform = 0;
      this._states = [];
      this._elItems.dataset.translate = '0';
      this._elListItem = this._el.querySelectorAll(`.${this.constructor.EL_ITEM}`);
      // добавляем к слайдам data-атрибуты
      this._elListItem.forEach((item, index) => {
        item.dataset.order = `${index}`;
        item.dataset.index = `${index}`;
        item.dataset.translate = '0';
        this._states.push(index === 0 ? 1 : 0);
      });
      // перемещаем последний слайд перед первым
      if (this._config.loop) {
        const count = this._elListItem.length - 1;
        const translate = -this._elListItem.length;
        this._elListItem[count].dataset.order = '-1';
        this._elListItem[count].dataset.translate = `${-this._elListItem.length}`;
        const valueX = translate * this._clientRect.width;
        this._elListItem[count].style.transform = `translate3D(${valueX}px, 0px, 0.1px)`;
      }
      this._el.querySelector(`.${this.constructor.EL_INDICATORS}`).remove();
      // добавляем индикаторы к слайдеру
      this._addIndicators();
      this._elListIndicator = document.querySelectorAll(`.${this.constructor.EL_INDICATOR}`);
      // обновляем экстремальные значения переменных
      this._updateExProperties();
      // помечаем активные элементы
      this._changeActiveItems();
    }
    this._autoplay();
  }

  // перейти к следующему слайду
  next() {
    this._direction = 'next';
    this._move();
  }
  // перейти к предыдущему слайду
  prev() {
    this._direction = 'prev';
    this._move();
  }
  // управление автоматической сменой слайдов
  autoplay() {
    this._autoplay('stop');
  }
  moveTo(index) {
    this._moveTo(index);
  }
}
