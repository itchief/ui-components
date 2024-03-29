const URL = 'processing.php';

const form = document.querySelector('.embed-video');
const elVideos = document.querySelector('.videos');
const elModal = document.querySelector('.modal');
const elIframe = elModal.querySelector('.iframe');

const createCard = (id, src, title) => `<div class="video-item" data-id="${id}">
  <div class="video-wrapper">
    <img class="video-thumbnail" src="${src}">
    </div>
    <h3 class="video-title">${title}</h3>
  </div>`;

const createURL = (id) => `${window.location.protocol}//www.youtube.com/embed/${id}?enablejsapi=1&origin=${window.location.origin}`;

(async () => {
  try {
    const response = await fetch(URL);
    if (response.ok) {
      const result = await response.json();
      const html = [];
      Object.keys(result).forEach((key) => {
        const item = result[key];
        html.push(createCard(key, item.image, item.title));
      });
      elVideos.innerHTML = html.join('');
    }
  } catch (error) {
    console.log(error);
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(e.target.action, {
      method: 'post',
      body: new FormData(e.target)
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        const videoId = result.id;
        if (elVideos.querySelector(`[data-id="${videoId}"]`)) {
          return;
        }
        const item = result.data;
        const html = createCard(videoId, item.image, item.title);
        elVideos.insertAdjacentHTML('beforeend', html);
        e.target.querySelector('input[name="url"]').value = '';
      } else {
        console.log('Произошла ошибка при добавлении видео в галерею')
      }
    }
  } catch (error) {
    console.log(error);
  }
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.closest('.video-item')) {
    e.preventDefault();
    const el = e.target.closest('.video-item');
    elIframe.src = createURL(el.dataset.id);
    elModal.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }
  if (e.target && e.target.closest('.modal-close')) {
    e.preventDefault();
    elIframe.src = '';
    elModal.classList.add('d-none');
    document.body.style.overflow = '';
  }
});

const input = form.querySelector('input');
input.addEventListener('input', () => {
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = !input.value.trim().length;
});
