'use strict';

// All commerce data is illustrative. No checkout, account or email is sent.
const products = [
  {id:'signum-l-signe',name:'L Signé',category:'SIGNUM · Фирменная подвеска',groups:['signature','necklaces'],material:'Золото 750 · бриллиант',price:98000,image:'signum/l-signe',tag:'ПОДПИСЬ ДОМА',description:'Перечёркнутая каллиграфическая L становится объёмным золотым росчерком. Маленький бриллиант отмечает пересечение линий, а плавное изменение толщины металла передаёт нажим пера. Фирменная подпись исторической коллекции SIGNUM.'},
  {id:'signum-aurea',name:'Aurea',category:'SIGNUM · Кольцо',groups:['rings'],material:'Золото 750 · бриллиант',price:168000,image:'signum/aurea',tag:'ЗОЛОТОЕ СЕЧЕНИЕ',description:'Архитектурное кольцо с открытой прямоугольной рамкой и смещённым от центра бриллиантом. Замысел внутренних делений основан на золотом сечении — пропорции 1:1,618. Свет и пространство внутри конструкции становятся частью украшения.'},
  {id:'signum-wedjat',name:'Wedjat',category:'SIGNUM · Подвеска',groups:['necklaces'],material:'Золото 750 · лазурит · оникс',price:142000,image:'signum/wedjat',tag:'ДРЕВНИЙ ЕГИПЕТ',description:'Глаз Гора из тонких золотых линий, с глубоким синим лазуритом и чёрным ониксом. Изгиб брови и завиток под глазом сохраняют узнаваемую форму египетского уаджета — древнего символа восстановления и защиты.'},
  {id:'signum-templum',name:'Templum',category:'SIGNUM · Подвеска',groups:['necklaces'],material:'Золото 750 · гранат · эмаль',price:186000,image:'signum/templum',tag:'РЫЦАРСКАЯ ГЕРАЛЬДИКА',description:'Орденский крест с расширяющимися концами, красной эмалью и гранатом в центре. Рыцарскую геометрию обрамляют тонкие золотые завитки в духе викторианских украшений. Авторская стилизация креста патте, вдохновлённая тамплиерской темой.'},
  {id:'signum-khepri',name:'Khepri',category:'SIGNUM · Кольцо',groups:['rings'],material:'Золото 750 · резной лазурит',price:156000,image:'signum/khepri',tag:'ВОСХОДЯЩЕЕ СОЛНЦЕ',description:'Скарабей с панцирем из резного лазурита и тонкими золотыми деталями. Его силуэт продолжает традицию египетских амулетов Хепри, связанных с восходящим солнцем и возрождением. Рельефная шинка поддерживает рисунок оправы.'},
  {id:'signum-laurus',name:'Laurus',category:'SIGNUM · Серьги',groups:['earrings'],material:'Золото 750 · бриллианты',price:124000,image:'signum/laurus',tag:'АНТИЧНЫЙ ЛАВР',description:'Парные лавровые ветви мягко поднимаются вдоль уха. На каждом листе выгравирована тонкая прожилка, матовое золото чередуется с полированными гранями. Небольшие бриллианты завершают композицию, вдохновлённую античными венками.'},
  {id:'signum-janus',name:'Janus',category:'SIGNUM · Медальон',groups:['necklaces'],material:'Золото 750 · рельефная чеканка',price:132000,image:'signum/janus',tag:'ДРЕВНИЙ РИМ',description:'Два соединённых профиля Януса смотрят в противоположные стороны на золотом медальоне. Матовый фон и полированный рельеф напоминают древнеримскую чеканку. В коллекции SIGNUM это образ взгляда одновременно в прошлое и будущее.'},
  {id:'signum-fleur-de-lys',name:'Fleur de Lys',category:'SIGNUM · Брошь',groups:['brooches'],material:'Золото 750 · эмаль · жемчуг',price:148000,image:'signum/fleur-de-lys',tag:'КОРОЛЕВСКАЯ ЛИЛИЯ',description:'Геральдическая лилия с вытянутыми золотыми лепестками, тёмно-синей эмалью и подвесной жемчужиной. Строгая симметрия и плавные боковые завитки отсылают к французской королевской геральдике.'},
  {id:'signum-astrolabium',name:'Astrolabium',category:'SIGNUM · Подвеска',groups:['necklaces'],material:'Золото 750 · сапфиры',price:198000,image:'signum/astrolabium',tag:'КАРТА НЕБА',description:'Ажурные концентрические кольца, тонкие координатные риски и сапфиры, обозначающие звёзды. Форма подвески вдохновлена исторической астролябией — инструментом наблюдения за небом. Точная геометрия складывается в маленькую личную карту.'},
  {id:'signum-ouroboros',name:'Ouroboros',category:'SIGNUM · Кольцо',groups:['rings'],material:'Золото 750 · изумруды',price:138000,image:'signum/ouroboros',tag:'НЕПРЕРЫВНОСТЬ',description:'Тонкая золотая змея замыкает кольцо, удерживая собственный хвост. Гравировка подчёркивает рисунок чешуи, а маленькие изумруды оживляют взгляд. Уроборос становится образом непрерывности, возвращения и течения времени.'}
];
const reviews = [
  {quote:'В L Signé понравился сам росчерк: особенно красиво выглядит с простой белой рубашкой. Маленький камень замечаешь только вблизи.',name:'Анна Миронова',product:'Подвеска L Signé',rating:5},
  {quote:'Выбрала Laurus за тонкие листья и мягкий изгиб. Ветки хорошо смотрятся и с собранными волосами, и с распущенными.',name:'София Ковалёва',product:'Серьги Laurus',rating:5},
  {quote:'У Aurea необычная открытая форма. Нравится, как видны внутренние линии и как меняются тени при повороте руки.',name:'Мария Андреева',product:'Кольцо Aurea',rating:5},
  {quote:'В Wedjat сразу привлёк синий цвет. Золотой контур очень выразительный, поэтому обычно ношу подвеску без других украшений.',name:'Екатерина Белова',product:'Подвеска Wedjat',rating:5},
  {quote:'Больше всего понравилась идея Janus и два профиля на медальоне. Хотелось бы выбрать цепочку подлиннее.',name:'Александр Лебедев',product:'Медальон Janus',rating:4.5}
];
const $ = (selector, root=document) => root.querySelector(selector);
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const findProduct = id => products.find(p => p.id === id);
const escapeText = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readState(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
let cart = readState('lothric-cart', []);
cart = Array.isArray(cart) ? cart.filter(item=>findProduct(item.id)&&Number.isInteger(item.qty)&&item.qty>0&&item.qty<=99&&typeof item.size==='string') : [];
try { localStorage.setItem('lothric-cart', JSON.stringify(cart)); } catch { /* Storage may be unavailable. */ }
let currentFilter = 'all';
let activePanel = '';
let activeProduct = null;
let toastTimer;
function saveState() { try { localStorage.setItem('lothric-cart',JSON.stringify(cart)); } catch { /* Storage may be blocked in private browser contexts. */ } updateBadges(); }
function updateBadges() { const count=cart.reduce((n,item)=>n+item.qty,0); $('#cart-count').textContent=count; $('#cart-count').hidden=!count; }
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000); }
function addCart(id,size='Универсальный') { const existing=cart.find(item=>item.id===id&&item.size===size);if(existing){if(existing.qty>=99){toast('Достигнуто максимальное количество');return;}existing.qty++;}else cart.push({id,size,qty:1});saveState();toast('Украшение добавлено в корзину'); }
const panel=$('#panel');
const menuToggle=$('.header-menu-toggle');
function openPanel(type,id=null) { if(type==='search'){toggleSearch();return;}closeSearch();activePanel=type;activeProduct=id;renderPanel();if(!panel.open)panel.showModal();requestAnimationFrame(()=>{const input=$('#panel-content input');if(input)input.focus();}); }
function closePanel(){panel.close();activePanel='';activeProduct=null;menuToggle.setAttribute('aria-expanded','false');}
function smallItem(p,controls='') {return `<div class="panel-item"><button data-view="${p.id}" aria-label="Посмотреть ${p.name}" style="padding:0"><img src="assets/${p.image}.webp" alt="${p.name}"></button><div><h3>${p.name}</h3><p>${money(p.price)}</p>${controls}</div></div>`;}
function renderPanel(){
  let html='';
  panel.dataset.view=activePanel;
  panel.setAttribute('aria-label',({menu:'Меню сайта',cart:'Корзина'})[activePanel]||'Lothric');
  menuToggle.setAttribute('aria-expanded',String(activePanel==='menu'));
  if(activePanel==='menu') html='<p class="eyebrow menu-caption">Ювелирный дом</p><nav class="mobile-nav" aria-label="Мобильная навигация"><a href="#catalog" data-menu-link>Каталог <span aria-hidden="true">↗</span></a><a href="#about" data-menu-link>О нас <span aria-hidden="true">↗</span></a><a href="#reviews" data-menu-link>Отзывы <span aria-hidden="true">↗</span></a><a href="#contacts" data-menu-link>Связаться <span aria-hidden="true">↗</span></a></nav>';
  if(activePanel==='cart') {
    html='<h2>Ваша <em>корзина.</em></h2>';
    if(!cart.length) html+='<div class="empty-state"><p>Здесь пока тихо. Найдите украшение со своим характером.</p><button class="button button-dark" data-go-catalog>Смотреть коллекцию ↗</button></div>';
    else { html+=cart.map((item,index)=>{const p=findProduct(item.id);return smallItem(p,`<p>${escapeText(item.size)}</p><div class="item-controls"><div class="quantity"><button data-quantity="${index}" data-step="-1" aria-label="Уменьшить количество ${p.name}">−</button><span>${item.qty}</span><button data-quantity="${index}" data-step="1" aria-label="Увеличить количество ${p.name}">+</button></div><button data-remove="${index}">Удалить</button></div>`);}).join('');html+=`<div class="panel-total"><span>Итого</span><span>${money(cart.reduce((n,item)=>n+findProduct(item.id).price*item.qty,0))}</span></div><button class="button button-dark" data-checkout>Оформить демо-заказ ↗</button><p class="muted">Демонстрационная корзина. Оплата и отправка заказов не подключены.</p>`;}
  }
  if(activePanel==='quick') {
    const p=findProduct(activeProduct);if(!p)return;
    html=`<img class="quick-image" src="assets/${p.image}.webp" alt="${p.name}"><p class="eyebrow">${p.category}</p><h2 style="margin-top:12px;margin-bottom:14px">${p.name}</h2><p>${money(p.price)}</p><p class="quick-description">${p.description}</p>${p.groups.includes('rings')?'<label class="panel-field">Размер кольца<select id="product-size"><option>16</option><option selected>17</option><option>18</option><option>19</option></select></label>':''}<button class="button button-dark" data-add="${p.id}">Добавить в корзину <span>+</span></button><p class="demo-note" style="margin-top:20px">Концептуальное изображение · демонстрационная цена</p>`;
  }
  if(activePanel==='contacts') html='<h2>Всегда <em>рядом.</em></h2><p>+1 444 555 9999<br>hello@lothric.example</p><p class="muted" style="margin-top:20px">Это демонстрационные контакты из макета. Перед запуском сайта замените их на телефон и адрес бренда.</p>';
  if(activePanel==='social') html='<h2>Истории <em>Lothric.</em></h2><p class="muted">Ссылки на социальные сети появятся здесь после подключения реальных страниц бренда. Сейчас это демонстрационный сайт.</p>';
  if(activePanel==='care') html='<h2>Бережное <em>прикосновение.</em></h2><p class="muted">Храните украшения по отдельности в мягких мешочках. Избегайте контакта позолоченной бижутерии с парфюмом и бытовой химией. Протирайте поверхность мягкой сухой тканью.</p><p class="muted" style="margin-top:20px">Точные рекомендации для золота, камней и покрытий добавьте после утверждения материалов реальной коллекции.</p>';
  if(activePanel==='privacy') html='<h2>Ваши <em>данные.</em></h2><p class="muted">Сайт работает локально. Поиск и корзина обрабатываются в браузере. Корзина сохраняется в localStorage на этом устройстве. Внешние аналитические сервисы не используются.</p><button class="button button-outline" data-clear-data>Очистить сохраненные данные</button>';
  if(activePanel==='checkout') html='<h2>Демо-заказ <em>готов.</em></h2><p class="muted">Вы проверили путь покупки. Заказ никуда не отправлен, деньги не списываются. Корзина сохранена для дальнейшего просмотра.</p><button class="button button-dark" data-panel="cart">Вернуться в корзину ↗</button>';
  $('#panel-content').innerHTML=html;
}
const headerSearch=$('#header-search');
const searchToggle=$('.header-search-toggle');
const searchInput=$('#search-input');
const searchPopover=$('#search-popover');
const mobileHeader=matchMedia('(max-width: 899px)');
let searchOpen=false;
function syncSearchHeader() {
  // The expanded mobile field uses the space normally occupied by the logo and menu.
  for(const element of [$('.header .brand'),menuToggle]) element.inert=searchOpen&&mobileHeader.matches;
}
function closeSearch(restoreFocus=false) {
  if(!searchOpen)return;
  searchOpen=false;
  $('#header').classList.remove('search-open');
  headerSearch.classList.remove('is-open');
  searchToggle.setAttribute('aria-expanded','false');
  if(restoreFocus||headerSearch.contains(document.activeElement))searchToggle.focus({preventScroll:true});
  $('.search-input-wrap').inert=true;
  searchPopover.inert=true;
  syncSearchHeader();
}
function toggleSearch() {
  if(searchOpen){closeSearch(true);return;}
  if(panel.open)closePanel();
  searchOpen=true;
  renderSearch(searchInput.value);
  $('.search-input-wrap').inert=false;
  searchPopover.inert=false;
  $('#header').classList.add('search-open');
  headerSearch.classList.add('is-open');
  searchToggle.setAttribute('aria-expanded','true');
  syncSearchHeader();
  searchInput.focus({preventScroll:true});
}
function productCount(count) {
  const tens=count%100,units=count%10;
  return `${count} ${tens>=11&&tens<=14?'украшений':units===1?'украшение':units>=2&&units<=4?'украшения':'украшений'}`;
}
function renderSearch(query) {
  const search=query.trim().toLocaleLowerCase('ru');
  const list=products.filter(p=>`${p.name} ${p.category} ${p.material} ${p.tag} ${p.description}`.toLocaleLowerCase('ru').includes(search));
  $('#search-title').textContent=search?'Результаты поиска':'Коллекция SIGNUM';
  $('#search-count').textContent=productCount(list.length);
  $('#search-results').innerHTML=list.length?list.map(p=>`<button class="search-result panel-item" type="button" data-view="${p.id}" aria-label="Посмотреть ${escapeText(p.name)} — ${money(p.price)}"><img src="assets/${p.image}.webp" alt="" width="72" height="80"><span class="search-result-copy"><span class="search-result-category">${p.category}</span><span class="search-result-name">${p.name}</span><span class="search-result-material">${p.material}</span><span class="search-result-price">${money(p.price)}</span></span><span class="search-result-arrow" aria-hidden="true">↗</span></button>`).join(''):'<div class="search-empty"><p>Ничего не найдено</p><span>Попробуйте «кольцо», «лазурит» или «Глаз Гора».</span></div>';
  $('#search-results').scrollTop=0;
}
searchInput.addEventListener('input',()=>renderSearch(searchInput.value));
$('.search-close').addEventListener('click',()=>closeSearch(true));
$('.search-bar').addEventListener('submit',event=>{event.preventDefault();$('#search-results [data-view]')?.focus();});
mobileHeader.addEventListener('change',syncSearchHeader);
document.addEventListener('pointerdown',event=>{if(searchOpen&&!headerSearch.contains(event.target))closeSearch();});
document.addEventListener('focusin',event=>{if(searchOpen&&!headerSearch.contains(event.target))closeSearch();});
document.addEventListener('keydown',event=>{
  if(searchOpen&&event.key==='Escape'){event.preventDefault();event.stopPropagation();closeSearch(true);}
},true);
headerSearch.addEventListener('keydown',event=>{
  if(!searchOpen||!['ArrowDown','ArrowUp'].includes(event.key))return;
  const results=[...headerSearch.querySelectorAll('[data-view]')];
  const index=results.indexOf(document.activeElement);
  if(document.activeElement!==searchInput&&index===-1)return;
  event.preventDefault();
  if(event.key==='ArrowDown')results[Math.min(index+1,results.length-1)]?.focus();
  else if(index<=0)searchInput.focus({preventScroll:true});
  else results[index-1].focus();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('button,a');if(!button)return;
  if(button.hasAttribute('data-panel'))openPanel(button.dataset.panel);
  if(button.hasAttribute('data-menu-link'))closePanel();
  if(button.hasAttribute('data-filter')){currentFilter=button.dataset.filter;renderCatalog();}
  if(button.hasAttribute('data-category-link')){currentFilter=button.dataset.categoryLink;renderCatalog();}
  if(button.hasAttribute('data-view')){event.preventDefault();openPanel('quick',button.dataset.view);}
  if(button.hasAttribute('data-add')) {
    const product = findProduct(button.dataset.add);
    if (product.groups.includes('rings') && activePanel !== 'quick') { openPanel('quick', product.id); return; }
    addCart(product.id, product.groups.includes('rings') ? `Размер ${$('#product-size').value}` : 'Универсальный');
  }
  if(button.hasAttribute('data-quantity')){const item=cart[Number(button.dataset.quantity)];item.qty=Math.min(99,item.qty+Number(button.dataset.step));if(item.qty<=0)cart.splice(Number(button.dataset.quantity),1);saveState();renderPanel();}
  if(button.hasAttribute('data-remove')){cart.splice(Number(button.dataset.remove),1);saveState();renderPanel();}
  if(button.hasAttribute('data-checkout'))openPanel('checkout');
  if(button.hasAttribute('data-go-catalog')){closePanel();$('#catalog').scrollIntoView({behavior:'smooth'});}
  if(button.hasAttribute('data-clear-data')){cart=[];saveState();toast('Корзина очищена');}
});
$('#close-panel').addEventListener('click',closePanel);
panel.addEventListener('cancel',()=>{activePanel='';activeProduct=null;menuToggle.setAttribute('aria-expanded','false');});
matchMedia('(min-width: 900px)').addEventListener('change',event=>{if(event.matches&&activePanel==='menu')closePanel();});
// Close immediately on Escape, including when a search input has focus.
panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePanel();}});
panel.addEventListener('click',event=>{const bounds=panel.getBoundingClientRect();if(event.target===panel&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))closePanel();});
// Demo form validates locally and retains the draft; it sends no personal data.
$('#contact-form').addEventListener('submit',event=>{
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  $('#contact-status').textContent='Форма заполнена. Это демонстрация: сообщение никуда не отправлено.';
});
function renderReviews() {
  const average=reviews.reduce((sum,review)=>sum+review.rating,0)/reviews.length;
  $('#review-count').textContent='1000+';
  $('#review-average').textContent=average.toFixed(1);
  $('#review-list').innerHTML=reviews.map(review=>`<li class="customer-review"><article><header class="customer-review-heading"><div><h3>${escapeText(review.name)}</h3><p class="customer-review-product">${escapeText(review.product)}</p></div><span class="rating-stars" role="img" aria-label="${review.rating} из 5"><span aria-hidden="true">★★★★★</span><span class="rating-stars-fill" style="width:${review.rating/5*100}%" aria-hidden="true">★★★★★</span></span></header><blockquote class="customer-review-text">${escapeText(review.quote)}</blockquote></article></li>`).join('');
}
renderCatalog();renderReviews();updateBadges();$('#year').textContent=new Date().getFullYear();
