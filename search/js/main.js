(() => {
  const { href } = window.location;
  const url = new URL(href);
  const params = new URLSearchParams(url.search);
  const q = (params.get('q') ?? '').trim();

  const form = document.querySelector('.search-form');

  if (!form) {
    return;
  }

  const input = form.querySelector('#search-input');
  const btnReset = form.querySelector('.search-reset');

  input.value = q;
  if (!input.value) {
    const result = document.querySelector('.gcse-result');
    result.innerHTML = '<div class="search-result">Вы не ввели запрос в поисковую строку.</div>';
    btnReset.hidden = true;
  } else {
    btnReset.hidden = false;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = `${url.origin}${url.pathname}?q=${encodeURIComponent(input.value.trim())}`;
  });

  form.addEventListener('reset', () => {
    btnReset.hidden = true;
  });

  input.addEventListener('input', () => {
    btnReset.hidden = !input.value;
  });
})();
