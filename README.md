# 🚀 Gulp Builder — быстрый старт для проектов на Gulp + Nunjucks + BEM

## 📖 Описание

Этот проект — сборка на **Gulp**, которая упрощает верстку и работу с блоками по методологии **БЭМ**.  
Поддерживает:

- 🧩 Компонентный подход (каждый блок = своя папка с `.html`, `.styl`, `.json`, `.js`)  
- 📝 **Nunjucks** с поддержкой **FrontMatter** в страницах  
- 🎨 Автоматическую компиляцию **Stylus → CSS** с автопрефиксами и сортировкой медиа-запросов  
- 🖼️ Определение размеров изображений (`width`, `height`) для `<img>`  
- 🕹️ Генерацию **SVG-спрайта**  
- 🔄 Автообновление через **BrowserSync**  
- 🛠️ Утилиту для быстрого создания новых блоков через файл `.create-block`  

---

## 📂 Структура проекта

```
project/
│── gulpfile.js        # Сборка Gulp
│── package.json       # Зависимости
│── .gitignore         # Игнорируемые файлы
│── .create-block      # Триггер для генерации новых блоков
│── dist/              # Скомпилированный проект
│
└── template/          # Исходники
    │── pages/         # Страницы (Nunjucks + FrontMatter)
    │── blocks/        # Блоки (BEM)
    │   └── header/
    │       ├── header.html
    │       ├── header.styl
    │       ├── header.json
    │       └── header.js
    │── styles/        # Общие стили (main.styl)
    │── js/            # Глобальные скрипты
    │── static/        # Статические файлы (img, fonts и т.д.)
    │── svg-for-sprite/# SVG-иконки для спрайта
    │── helpers/       # Хелперы для Nunjucks
    │── site-data.js   # Общие данные сайта
```

---

## 🚀 Установка и запуск

1. Установи зависимости:

```bash
npm install
```

2. Запуск разработки:

```bash
npm run dev
```

3. Сборка проекта:

```bash
npm run build
```

4. Очистка папки `dist`:

```bash
npm run clean
```

После запуска разработки проект будет доступен по адресу:  
👉 **http://localhost:3000/**

---

## 📄 Страницы

Страницы хранятся в `template/pages/`.  
Поддерживается **FrontMatter**:

```yaml
---
pageTitle: Главная страница
bodyClasses: main-page
layout:
  header: true
  footer: true
---
```

Использование в шаблоне:

```html
<title>{{ pageTitle }}</title>
<body class="{{ bodyClasses }}">
```

---

## 🧩 Блоки

Каждый блок хранится в папке `template/blocks/{blockName}/`.

Пример: `template/blocks/header/`

```
header.html
header.styl
header.json
header.js
```

### 📌 Пример блока `header.html`:

```html
<header block="header">
  <div elem="logo">
    <img src="{{ logo.img }}" alt="{{ logo.alt }}">
  </div>
</header>
```

### 📌 Пример `header.json`:

```json
{
  "logo": {
    "img": "img/logo.png",
    "alt": "Логотип сайта"
  }
}
```

В шаблоне данные доступны напрямую:  
```html
<img src="{{ logo.img }}" alt="{{ logo.alt }}">
```

---

## ⚡ Быстрое создание блоков

Файл **`.create-block`** служит триггером.  
Запиши туда строку:

```
cb header -t html,styl,js,json
```

После сохранения Gulp автоматически создаст папку:

```
template/blocks/header/
│── header.html
│── header.styl
│── header.js
│── header.json
```

---

## 🖼️ Изображения

При сборке плагин **автоматически прописывает `width` и `height`** у всех `<img>`:

Пример:

```html
<img src="img/countries-bg.png" alt="">
```

На выходе:

```html
<img width="1838" height="1427" src="img/countries-bg.png" alt="">
```

---

## 🧩 SVG-спрайт

Иконки из папки `template/svg-for-sprite/` объединяются в `dist/img/sprite.svg`.

Вызов в шаблоне:

```html
{{ _icon('menu', { tag: 'span' }) }}
```

---

## 🌍 Стартовая страница

При запуске по адресу [http://localhost:3000/](http://localhost:3000/)  
открывается список всех страниц с:

- названием страницы (`pageTitle`)
- ссылкой на файл
- датой последнего изменения

---

## 🔧 Полезные глобальные переменные в Nunjucks

- `{{ pageTitle }}` — заголовок страницы из FrontMatter  
- `{{ bodyClasses }}` — классы для `<body>`  
- `{{ site.* }}` — данные из `site-data.js`  
- `{{ inlineSvgSprite() | safe }}` — встроенный SVG-спрайт  
- `{{ _icon('phone', { tag: 'span' }) | safe }}` — иконка из спрайта  

---


