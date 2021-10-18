(function() {
  let hasLoaded = false;
  const elements = [];
  // функция для подсветки синтаксиса элементов находящихся в elements посредством методов highlight.js
  const highlight = () => {
    const items = elements.slice();
    elements.length = 0;
    items.forEach(item => {
      let lang = false;
      item.classList.forEach(className => {
        if (className.indexOf('lang-') === 0) {
          lang = className.replace('lang-', '');
        }
      })
      const result = lang ? hljs.highlight(item.textContent, { language: lang }) : hljs.highlightAuto(item.textContent);
      item.innerHTML = result.value;
    });
  }

  const loadCSSandJS = () => {
    // вставляем стили
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/css/highlight.min.css';
    document.head.appendChild(style);
    // вставляем скрипт
    const script = document.createElement('script');
    script.src = 'assets/js/highlight.min.js';
    script.async = 1;
    document.head.appendChild(script);
    script.onload = () => {
      // после загрузки скрипта присваиваем переменной hasLoaded значение true и вызываем функцию highlight для подсветки синтаксиса
      hasLoaded = true;
      highlight();
    }
  }

  const cb = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        elements.push(target);
        observer.unobserve(target);
      }
    });
    if (elements.length) {
      if (hasLoaded) {
        highlight();
      } else {
        loadCSSandJS();
      }
    }
  }
  const params = {
    root: null,
    rootMargin: '0px 0px 200px 0px'
  }
  // создаем observer
  const observer = new IntersectionObserver(cb, params);
  document.querySelectorAll('pre>code').forEach(item => {
    observer.observe(item);
  });
})();
