/**
 * ItcSlider by itchief v3.0.0 (https://github.com/itchief/ui-components/tree/master/itc-slider)
 * Copyright 2020 - 2022 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/ui-components/blob/master/LICENSE)
 */

class ItcSlider {
  static CLASS_CONTROL = 'slider__control';
  static CLASS_CONTROL_HIDE = 'slider__control_hide';
  static CLASS_ITEM_ACTIVE = 'slider__item_active';
  static CLASS_INDICATOR_ACTIVE = 'active';
  static SEL_WRAPPER = '.slider__wrapper';
  static SEL_ITEM = '.slider__item';
  static SEL_ITEMS = '.slider__items';
  static SEL_PREV = '.slider__control[data-slide="prev"]';
  static SEL_NEXT = '.slider__control[data-slide="next"]';
  static SEL_INDICATOR = '.slider__indicators>li';
  static TRANSITION_OFF = 'slider_disable-transition';

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
      el.dataset.sliderId = this.contains.length;
      el.querySelectorAll('.slider__control').forEach((btn) => {
        btn.dataset.sliderTarget = this.contains.length;
      });
    });
  }

  constructor(selector, config) {
    // получаем элементы
    this._el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    this._elWrapper = this._el.querySelector(ItcSlider.SEL_WRAPPER);
    this._elItems = this._el.querySelector(ItcSlider.SEL_ITEMS);
    this._elItemList = this._el.querySelectorAll(ItcSlider.SEL_ITEM);
    this._elBtnPrev = this._el.querySelector(ItcSlider.SEL_PREV);
    this._elBtnNext = this._el.querySelector(ItcSlider.SEL_NEXT);
    this._elIndicatorList = this._el.querySelectorAll(ItcSlider.SEL_INDICATOR);
    // экстремальные значения слайдов
    this._minOrder = 0;
    this._maxOrder = 0;
    this._$itemWithMinOrder = null;
    this._$itemWithMaxOrder = null;
    this._minTranslate = 0;
    this._maxTranslate = 0;
    // направление смены слайдов (по умолчанию)
    this._direction = 'next';
    // determines whether the position of item needs to be determined
    this._balancingItemsFlag = false;
    this._activeItems = [];
    // текущее значение трансформации
    this._transform = 0;
    // swipe параметры
    this._hasSwipeState = false;
    this._swipeStartPos = 0;
    // slider properties
    this._transform = 0; // текущее значение трансформации
    this._intervalId = null;
    // configuration of the slider
    this._config = {
      loop: true,
      autoplay: false,
      interval: 5000,
      refresh: true,
      swipe: true,
    };
    this._config = Object.assign(this._config, config);
    // create some constants
    this._widthItem = this._elItemList[0].getBoundingClientRect().width;
    this._widthWrapper = this._elWrapper.getBoundingClientRect().width;
    this._itemsInVisibleArea = Math.round(this._widthWrapper / this._widthItem);
    // initial setting properties
    this._transformStep = 100 / this._itemsInVisibleArea;
    this._widthStep = this._widthItem;
    const itemsInVisibleArea = this._itemsInVisibleArea;
    // добавляем data-атрибуты к .slider__item
    this._elItemList.forEach((el, index) => {
      el.dataset.index = index;
      el.dataset.order = index;
      el.dataset.translate = 0;
      index < itemsInVisibleArea ? this._activeItems.push(index) : null;
    });
    if (this._config.loop) {
      // перемещаем последний слайд перед первым
      const count = this._elItemList.length - 1;
      const translate = -this._elItemList.length * this._widthStep;
      this._elItemList[count].dataset.order = -1;
      this._elItemList[count].dataset.translate = translate;
      this._elItemList[count].style.transform = `translateX(${translate}px)`;
      this._refreshExtremeValues();
    } else if (this._elBtnPrev) {
      this._elBtnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
    }
    this._setActiveClass();
    this._addEventListener();
    this._updateIndicators();
    this._autoplay();
  }
  _addEventListener() {
    const $root = this._el;
    const $items = this._elItems;
    const config = this._config;

    function onClick(e) {
      const $target = e.target;
      this._autoplay('stop');
      if ($target.classList.contains(ItcSlider.CLASS_CONTROL)) {
        e.preventDefault();
        this._direction = $target.dataset.slide;
        this._move();
      } else if ($target.dataset.slideTo) {
        const index = parseInt($target.dataset.slideTo, 10);
        this._moveTo(index);
      }
      if (this._config.loop) {
        this._autoplay();
      }
    }

    function onMouseEnter() {
      this._autoplay('stop');
    }

    function onMouseLeave() {
      this._autoplay();
    }

    function onTransitionStart() {
      if (this._balancingItemsFlag) {
        return;
      }
      this._balancingItemsFlag = true;
      window.requestAnimationFrame(this._balancingItems.bind(this));
    }

    function onTransitionEnd() {
      this._balancingItemsFlag = false;
    }

    function onResize() {
      window.requestAnimationFrame(this._refresh.bind(this));
    }

    function onSwipeStart(e) {
      this._autoplay('stop');
      const event = e.type.search('touch') === 0 ? e.touches[0] : e;
      this._swipeStartPos = event.clientX;
      this._hasSwipeState = true;
    }

    function onSwipeEnd(e) {
      if (!this._hasSwipeState) {
        return;
      }
      const event = e.type.search('touch') === 0 ? e.changedTouches[0] : e;
      const diffPos = this._swipeStartPos - event.clientX;
      if (diffPos > 50) {
        this._direction = 'next';
        this._move();
      } else if (diffPos < -50) {
        this._direction = 'prev';
        this._move();
      }
      this._hasSwipeState = false;
      if (this._config.loop) {
        this._autoplay();
      }
    }

    function onDragStart(e) {
      e.preventDefault();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        this._autoplay('stop');
      } else if (document.visibilityState === 'visible') {
        if (this._config.loop) {
          this._autoplay();
        }
      }
    }

    $root.addEventListener('click', onClick.bind(this));
    $root.addEventListener('mouseenter', onMouseEnter.bind(this));
    $root.addEventListener('mouseleave', onMouseLeave.bind(this));
    // on resize
    if (config.refresh) {
      window.addEventListener('resize', onResize.bind(this));
    }
    // on transitionstart and transitionend
    if (config.loop) {
      $items.addEventListener('transition-start', onTransitionStart.bind(this));
      $items.addEventListener('transitionend', onTransitionEnd.bind(this));
    }
    // on touchstart and touchend
    if (config.swipe) {
      $root.addEventListener('touchstart', onSwipeStart.bind(this));
      $root.addEventListener('mousedown', onSwipeStart.bind(this));
      document.addEventListener('touchend', onSwipeEnd.bind(this));
      document.addEventListener('mouseup', onSwipeEnd.bind(this));
    }
    $root.addEventListener('dragstart', onDragStart.bind(this));
    // при изменении активности вкладки
    document.addEventListener('visibilitychange', onVisibilityChange.bind(this));
  }
  _refreshExtremeValues() {
    const $itemList = this._elItemList;
    this._minOrder = +$itemList[0].dataset.order;
    this._maxOrder = this._minOrder;
    this._$itemByMinOrder = $itemList[0];
    this._$itemByMaxOrder = $itemList[0];
    this._minTranslate = +$itemList[0].dataset.translate;
    this._maxTranslate = this._minTranslate;
    for (let i = 0, length = $itemList.length; i < length; i++) {
      const $item = $itemList[i];
      const order = +$item.dataset.order;
      if (order < this._minOrder) {
        this._minOrder = order;
        this._$itemByMinOrder = $item;
        this._minTranslate = +$item.dataset.translate;
      } else if (order > this._maxOrder) {
        this._maxOrder = order;
        this._$itemByMaxOrder = $item;
        this._maxTranslate = +$item.dataset.translate;
      }
    }
  }
  _balancingItems() {
    if (!this._balancingItemsFlag) {
      return;
    }
    const $wrapperClientRect = this._elWrapper.getBoundingClientRect();
    const widthHalfItem = $wrapperClientRect.width / this._itemsInVisibleArea / 2;
    const count = this._elItemList.length;
    let translate;
    let clientRect;
    if (this._direction === 'next') {
      const wrapperLeft = $wrapperClientRect.left;
      const $min = this._$itemByMinOrder;
      translate = this._minTranslate;
      clientRect = $min.getBoundingClientRect();
      if (clientRect.right < wrapperLeft - widthHalfItem) {
        $min.dataset.order = this._minOrder + count;
        // translate += count * 100;
        translate += count * this._widthStep;
        $min.dataset.translate = translate;
        $min.style.transform = `translateX(${translate}px)`;
        // update values of extreme properties
        this._refreshExtremeValues();
      }
    } else {
      const wrapperRight = $wrapperClientRect.right;
      const $max = this._$itemByMaxOrder;
      translate = this._maxTranslate;
      clientRect = $max.getBoundingClientRect();
      if (clientRect.left > wrapperRight + widthHalfItem) {
        $max.dataset.order = this._maxOrder - count;
        // translate -= count * 100;
        translate -= count * this._widthStep;
        $max.dataset.translate = translate;
        $max.style.transform = `translateX(${translate}px)`;
        // update values of extreme properties
        this._refreshExtremeValues();
      }
    }
    // updating...
    requestAnimationFrame(this._balancingItems.bind(this));
  }
  _setActiveClass() {
    const activeItems = this._activeItems;
    const $itemList = this._elItemList;
    for (let i = 0, length = $itemList.length; i < length; i++) {
      const $item = $itemList[i];
      const index = +$item.dataset.index;
      if (activeItems.indexOf(index) > -1) {
        $item.classList.add(ItcSlider.CLASS_ITEM_ACTIVE);
      } else {
        $item.classList.remove(ItcSlider.CLASS_ITEM_ACTIVE);
      }
    }
  }
  _updateIndicators() {
    const $indicatorList = this._elIndicatorList;
    const $itemList = this._elItemList;
    if (!$indicatorList.length) {
      return;
    }
    for (let index = 0, length = $itemList.length; index < length; index++) {
      const $item = $itemList[index];
      if ($item.classList.contains(ItcSlider.CLASS_ITEM_ACTIVE)) {
        $indicatorList[index].classList.add(ItcSlider.CLASS_INDICATOR_ACTIVE);
      } else {
        $indicatorList[index].classList.remove(ItcSlider.CLASS_INDICATOR_ACTIVE);
      }
    }
  }
  _move() {
    const step = this._direction === 'next' ? -this._widthStep : this._widthStep;
    const transform = this._transform + step;
    if (!this._config.loop) {
      const endTransformValue = this._widthStep * (this._elItemList.length - this._itemsInVisibleArea);
      if (transform < -endTransformValue || transform > 0) {
        return;
      }
      if (this._elBtnPrev) {
        this._elBtnPrev.classList.remove(ItcSlider.CLASS_CONTROL_HIDE);
        this._elBtnNext.classList.remove(ItcSlider.CLASS_CONTROL_HIDE);
        if (transform === -endTransformValue) {
          this._elBtnNext.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
        } else if (transform === 0) {
          this._elBtnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
        }
      }
    }
    const activeIndex = [];
    let i = 0;
    let length;
    let index;
    let newIndex;
    if (this._direction === 'next') {
      for (i = 0, length = this._activeItems.length; i < length; i++) {
        index = this._activeItems[i];
        index += 1;
        newIndex = index;
        if (newIndex > this._elItemList.length - 1) {
          newIndex -= this._elItemList.length;
        }
        activeIndex.push(newIndex);
      }
    } else {
      for (i = 0, length = this._activeItems.length; i < length; i++) {
        index = this._activeItems[i];
        index -= 1;
        newIndex = index;
        if (newIndex < 0) {
          newIndex += this._elItemList.length;
        }
        activeIndex.push(newIndex);
      }
    }
    this._activeItems = activeIndex;
    this._setActiveClass();
    this._updateIndicators();
    this._transform = transform;
    this._elItems.style.transform = `translateX(${transform}px)`;
    this._elItems.dispatchEvent(new CustomEvent('transition-start', {
      bubbles: true,
    }));
  }
  _moveToNext() {
    this._direction = 'next';
    this._move();
  }
  _moveToPrev() {
    this._direction = 'prev';
    this._move();
  }
  _moveTo(index) {
    const $indicatorList = this._elIndicatorList;
    let nearestIndex = null;
    let diff = null;
    let i;
    let length;
    for (i = 0, length = $indicatorList.length; i < length; i++) {
      const $indicator = $indicatorList[i];
      if ($indicator.classList.contains(ItcSlider.CLASS_INDICATOR_ACTIVE)) {
        const slideTo = +$indicator.dataset.slideTo;
        if (diff === null) {
          nearestIndex = slideTo;
          diff = Math.abs(index - nearestIndex);
        } else if (Math.abs(index - slideTo) < diff) {
          nearestIndex = slideTo;
          diff = Math.abs(index - nearestIndex);
        }
      }
    }
    diff = index - nearestIndex;
    if (diff === 0) {
      return;
    }
    this._direction = diff > 0 ? 'next' : 'prev';
    for (i = 1; i <= Math.abs(diff); i++) {
      this._move();
    }
  }
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
  _refresh() {
    // create some constants
    const $itemList = this._elItemList;
    const widthItem = $itemList[0].getBoundingClientRect().width;
    const widthWrapper = this._elWrapper.getBoundingClientRect().width;
    const itemsInVisibleArea = Math.round(widthWrapper / widthItem);

    if (widthItem === this._widthStep && itemsInVisibleArea === this._itemsInVisibleArea) {
      return;
    }

    this._autoplay('stop');

    this._elItems.classList.add(ItcSlider.TRANSITION_OFF);
    this._elItems.style.transform = 'translateX(0)';

    // setting properties after reset
    this._widthItem = widthItem;
    this._widthWrapper = widthWrapper;
    this._itemsInVisibleArea = itemsInVisibleArea;
    this._transform = 0;
    this._transformStep = 100 / itemsInVisibleArea;
    this._widthStep = widthItem;
    this._balancingItemsFlag = false;
    this._activeItems = [];

    // setting order and translate items after reset
    for (let i = 0, length = $itemList.length; i < length; i++) {
      const $item = $itemList[i];
      const position = i;
      $item.dataset.index = position;
      $item.dataset.order = position;
      $item.dataset.translate = 0;
      $item.style.transform = 'translateX(0)';
      if (position < itemsInVisibleArea) {
        this._activeItems.push(position);
      }
    }

    this._setActiveClass();
    this._updateIndicators();
    window.requestAnimationFrame(() => {
      this._elItems.classList.remove(ItcSlider.TRANSITION_OFF);
    });

    // hide prev arrow for non-infinite slider
    if (!this._config.loop) {
      if (this._elBtnPrev) {
        this._elBtnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
      }
      return;
    }

    // translate last item before first
    const count = $itemList.length - 1;
    // const translate = -$itemList.length * 100;
    const translate = -$itemList.length * this._widthStep;
    $itemList[count].dataset.order = -1;
    $itemList[count].dataset.translate = translate;
    $itemList[count].style.transform = `translateX(${translate}px)`;
    // update values of extreme properties
    this._refreshExtremeValues();
    // calling _autoplay
    this._autoplay();
  }
  next() {
    this._moveToNext();
  }
  prev() {
    this._moveToPrev();
  }
  moveTo(index) {
    this._moveTo(index);
  }
  refresh() {
    this._refresh();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ItcSlider.createInstances();
});
