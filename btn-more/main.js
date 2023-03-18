const btnMoreElem = document.querySelector('.btn-more');

const loadMore = async (e) => {
  try {
    // получим элемент на котором произошло событие, в данном случае кнопку
    const targetElem = e.target;
    // получим корневой элемент, в котором располагаются вся разметка, связанная с карточками и кнопкой
    const cardsElem = targetElem.closest('.cards');
    // сделаем кнопку неактивной
    targetElem.disabled = true;
    // добавим к кнопке класс btn-more-loading, который добавляет анимацию вращения для иконки
    targetElem.classList.add('btn-more-loading');
    // создадим новый объект класса FormData
    const body = new FormData();
    // добавим в body номер текущей страницы
    body.append('page', targetElem.dataset.page);
    // получим ответ от сервера
    const response = await fetch('more.php', {method: 'POST', body});
    // выполняем действия указанные в if, если ответ от сервера успешный
    if (response.ok) {
      // читаем ответ от сервера как JSON и преобразовываем его в объект JavaScript
      const result = await response.json();
      // выполняем код анонимной функции, переданной в качестве аргумента методу setTimeout, через 500мс
      window.setTimeout(() => {
        // скрываем кнопку загрузки, если все карточки показаны
        result.remain <= 0 ? targetElem.classList.add('d-none') : null;
        // устанавливаем для кнопки в атрибут data-page значение переменной page, увеличенное на 1
        targetElem.dataset.page = ++result.page;
        // создаём массив карточек для вставки на страницу
        const cards = result.data.map((item) => {
          let html = result.template;
          Object.keys(item).forEach((field) => {
            html = html.replaceAll(`{{${field}}}`, item[field]);
          })
          return html;
        });
        // устанавливаем в качестве содержимого элемента .cards-count количество показанных карточек
        cardsElem.querySelector('.cards-count').textContent = result.total - result.remain;
        // устанавливаем в качестве содержимого элемента .cards-total общее количество карточек
        cardsElem.querySelector('.cards-total').textContent = result.total;
        // обновляем ширину прогресс-бара, отвечающего за количество показанных карточек
        cardsElem.querySelector('.progress-bar').style.width = `${(result.total - result.remain) / result.total * 100}%`;
        // вставляем карточки в контейнер
        document.querySelector('.card-container').insertAdjacentHTML('beforeend', cards.join(''));
        // удаляем анимацию иконки, с помощью удаления класса btn-more-loading
        targetElem.classList.remove('btn-more-loading');
        // делаем кнопку доступной для нажатия
        targetElem.disabled = false;
      }, 500);
    }
  } catch (error) {
    console.error(error);
  }
}

btnMoreElem.addEventListener('click', loadMore);

btnMoreElem.click();



