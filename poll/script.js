const STORAGE_KEY = 'poll_color_votes';
const COLORS = ['Красный', 'Синий', 'Зеленый', 'Желтый'];

const form = document.getElementById('poll-form');
const resultsContainer = document.getElementById('poll-results');

const getVotes = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : Array(COLORS.length).fill(0);
};

const saveVotes = votes => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
};

// Функция для отображения результатов
const renderResults = () => {
    const votes = getVotes();
    const totalVotes = votes.reduce((sum, v) => sum + v, 0);

    // Если голосов нет
    if (totalVotes === 0) {
        resultsContainer.innerHTML = `
            <h3>Результаты голосования:</h3>
            <div>Пока нет голосов</div>
        `;
        return;
    }

    // Если голоса есть
    resultsContainer.innerHTML = `
        <h3>Результаты голосования:</h3>
        <ul>
            ${votes.map((count, index) => {
                const percent = Math.round((count / totalVotes) * 100);
                return `<li>${COLORS[index]} – ${count} голосов (${percent}%)</li>`;
            }).join('')}
        </ul>
        <div><strong>Всего голосов:</strong> ${totalVotes}</div>
    `;
};

// Обработчик отправки формы
form.addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const selectedIndex = Number(formData.get('color'));
    const votes = getVotes();
    votes[selectedIndex]++;
    saveVotes(votes);
    form.reset();
    renderResults();
});

// Инициализируем отображение начальных результатов
renderResults();
