// Находим элементы интерфейса
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const downloadBtn = document.getElementById('downloadBtn');
const loadingStatus = document.getElementById('loadingStatus');
const formatRadioButtons = document.querySelectorAll('input[name="format"]');

let convertedUrl = null;
let originalFileName = "";
let currentFile = null; // Здесь будем хранить оригинальный загруженный HEIC-файл

// 1. Обработка клика по зоне сброса
dropZone.addEventListener('click', () => fileInput.click());

// 2. Обработка перетаскивания файлов (Drag & Drop)
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// 3. Следим за переключением формата
formatRadioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
        // Если пользователь кликнул по формату И файл уже был загружен ранее
        if (currentFile) {
            convertHeic(currentFile);
        }
    });
});

// 4. Основная функция обработки файла
function handleFile(file) {
    // Проверяем расширение файла (в нижнем регистре)
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'heic' && fileExtension !== 'heif') {
        alert('Please select a valid Apple HEIC or HEIF image.');
        return;
    }

    currentFile = file; // Запоминаем файл в памяти
    originalFileName = file.name.substring(0, file.name.lastIndexOf('.'));
    convertHeic(file);
}

// 5. Логика конвертации с помощью библиотеки heic2any
async function convertHeic(file) {
    // Скрываем прошлые результаты и показываем спиннер
    previewContainer.style.display = 'none';
    loadingStatus.style.display = 'flex';

    // Получаем выбранный формат из радио-кнопок
    const targetFormat = document.querySelector('input[name="format"]:checked').value; // 'jpeg' или 'png'

    try {
        // Запускаем конвертацию
        const resultBlob = await heic2any({
            blob: file,
            toType: `image/${targetFormat}`,
            quality: 0.9 // Качество для jpeg (90%)
        });

        // Если пришел массив блобов, берем первый
        const finalBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;

        // Освобождаем старую ссылку, чтобы не забивать память браузера
        if (convertedUrl) {
            URL.revokeObjectURL(convertedUrl);
        }

        // Создаем локальную ссылку на сконвертированный файл в памяти браузера
        convertedUrl = URL.createObjectURL(finalBlob);

        // Показываем превью
        imagePreview.src = convertedUrl;
        
        // Настраиваем кнопку скачивания
        const ext = targetFormat === 'jpeg' ? 'jpg' : 'png';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = convertedUrl;
            link.download = `${originalFileName}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // Скрываем лоадер и показываем результат
        loadingStatus.style.display = 'none';
        previewContainer.style.display = 'block';

    } catch (error) {
        console.error(error);
        loadingStatus.style.display = 'none';
        alert('Conversion failed. The file might be corrupted or unsupported.');
    }
}