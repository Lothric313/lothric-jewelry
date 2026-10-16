'use strict';

// Five repeated runs provide invisible room to loop in either direction.
// After settling, the track moves to an identical copy in the middle run.
const carouselTrack = document.querySelector('#product-grid');
const carouselCopies = 5;
let carouselProducts = [];
let selectedProductIndex = -1;
let selectedSlideIndex = -1;
let requestedSlideIndex = -1;
let carouselFrame = 0;
let carouselSettleTimer = 0;
let carouselDrag = null;
let carouselDragFrame = 0;
let carouselCenterFrame = 0;
let carouselCenterMotion = null;
let ignoreCarouselClick = false;
const wrapProduct = index => ((index % carouselProducts.length) + carouselProducts.length) % carouselProducts.length;

function renderCatalog() {
  cancelCarouselCentering();
  clearTimeout(carouselSettleTimer);
  carouselProducts = products.filter(product => currentFilter === 'all' || product.groups.includes(currentFilter));
  selectedProductIndex = -1;
  selectedSlideIndex = -1;
  const count = carouselProducts.length;
  const total = count > 1 ? count * carouselCopies : count;
  carouselTrack.innerHTML = Array.from({ length: total }, (_, position) => {
    const product = carouselProducts[position % count];
    return '<article class="carousel-slide" data-product="' + product.id + '" data-slide="' + position + '">' +
      '<button class="carousel-image" data-carousel-select="' + product.id + '" data-slide="' + position + '" aria-label="Выбрать ' + product.name + '">' +
      '<img src="assets/' + product.image + '.webp" alt="' + product.name + '" loading="eager" width="1024" height="1024" draggable="false">' +
      '</button></article>';
  }).join('');
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const initialProduct = currentFilter === 'all'
    ? Math.max(0, carouselProducts.findIndex(product => product.id === 'signum-templum')) : 0;
  const initialIndex = count > 1 ? 2 * count + initialProduct : 0;
  requestedSlideIndex = initialIndex;
  selectCenteredProduct(initialIndex);
  requestAnimationFrame(() => centerSlide(initialIndex, 'instant'));
}

function selectCenteredProduct(physicalIndex) {
  const index = wrapProduct(physicalIndex);
  const changed = index !== selectedProductIndex;
  selectedSlideIndex = physicalIndex;
  selectedProductIndex = index;
  const focusedSlide = document.activeElement && document.activeElement.closest('.carousel-slide');
  if (focusedSlide && carouselTrack.contains(focusedSlide) && Math.abs(Number(focusedSlide.dataset.slide) - physicalIndex) > 1) {
    carouselTrack.focus({ preventScroll: true });
  }
  Array.from(carouselTrack.children).forEach((slide, position) => {
    const sameProduct = position % carouselProducts.length === index;
    const centered = position === physicalIndex;
    // Identical copies share geometry, preventing a flash during recentering.
    slide.classList.toggle('is-selected', sameProduct);
    slide.classList.toggle('is-centered', centered);
    slide.setAttribute('aria-hidden', String(Math.abs(position - physicalIndex) > 1));
    const button = slide.querySelector('button');
    button.tabIndex = Math.abs(position - physicalIndex) <= 1 ? 0 : -1;
    button.setAttribute('aria-current', String(centered));
    button.setAttribute('aria-label', (centered ? 'Посмотреть ' : 'Выбрать ') + carouselProducts[position % carouselProducts.length].name);
  });
  if (changed) {
    const product = carouselProducts[index];
    document.querySelector('#selected-product').innerHTML =
      '<h3>' + product.name + '</h3><p class="selected-material">' + product.material + '</p>' +
      '<p class="selected-price">' + money(product.price) + '</p>' +
      '<button class="button button-dark" data-add="' + product.id + '">В корзину <span aria-hidden="true">+</span></button>';
  }
  document.querySelector('#product-prev').disabled = carouselProducts.length < 2;
  document.querySelector('#product-next').disabled = carouselProducts.length < 2;
}

function cancelCarouselCentering() {
  cancelAnimationFrame(carouselCenterFrame);
  carouselCenterFrame = 0;
  carouselCenterMotion = null;
  carouselTrack.classList.remove('is-animating');
}

function animateCarouselCenter(time) {
  const motion = carouselCenterMotion;
  if (!motion) return;
  if (motion.start === null) motion.start = time;
  const progress = Math.min(1, (time - motion.start) / motion.duration);
  const eased = 1 - Math.pow(1 - progress, 3);
  carouselTrack.scrollTo({ left: motion.from + (motion.to - motion.from) * eased, behavior: 'instant' });
  if (progress < 1) {
    carouselCenterFrame = requestAnimationFrame(animateCarouselCenter);
  } else {
    carouselCenterFrame = 0;
    carouselCenterMotion = null;
    selectCenteredProduct(motion.index);
    recenterCarousel();
    carouselTrack.classList.remove('is-animating');
  }
}

function centerSlide(index, behavior = 'smooth') {
  const slide = carouselTrack.children[index];
  if (!slide) return;
  cancelCarouselCentering();
  requestedSlideIndex = index;
  const to = slide.offsetLeft + slide.offsetWidth / 2 - carouselTrack.clientWidth / 2;
  const from = carouselTrack.scrollLeft;
  if (behavior === 'instant' || window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(to - from) < 1) {
    carouselTrack.scrollTo({ left: to, behavior: 'instant' });
    return;
  }
  // Disable native snap until the exact center is reached; otherwise releasing
  // the mouse can snap instantly before a smooth scroll even starts.
  carouselTrack.classList.add('is-animating');
  carouselCenterMotion = { from, to, index, start: null, duration: Math.min(650, Math.max(380, Math.abs(to - from) * .65)) };
  carouselCenterFrame = requestAnimationFrame(animateCarouselCenter);
}

function centerProduct(index, behavior = 'smooth') {
  const run = Math.floor(selectedSlideIndex / carouselProducts.length);
  centerSlide(run * carouselProducts.length + wrapProduct(index), behavior);
}

function syncCenteredProduct() {
  carouselFrame = 0;
  selectCenteredProduct(closestSlide(carouselTrack.scrollLeft));
  if (carouselDrag && carouselDrag.moved) recenterCarousel();
}

function closestSlide(scrollPosition) {
  const center = scrollPosition + carouselTrack.clientWidth / 2;
  let closest = 0;
  let distance = Infinity;
  Array.from(carouselTrack.children).forEach((slide, index) => {
    const offset = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
    if (offset < distance) { distance = offset; closest = index; }
  });
  return closest;
}

function recenterCarousel(force = false) {
  const count = carouselProducts.length;
  if (count < 2) return;
  if (!force && selectedSlideIndex >= count && selectedSlideIndex < count * 4) return;
  const middleIndex = 2 * count + selectedProductIndex;
  const shift = middleIndex - selectedSlideIndex;
  const offset = carouselTrack.children[middleIndex].offsetLeft - carouselTrack.children[selectedSlideIndex].offsetLeft;
  requestedSlideIndex += shift;
  if (carouselDrag) { carouselDrag.scroll += offset; carouselDrag.target += offset; }
  selectCenteredProduct(middleIndex);
  carouselTrack.classList.add('is-recentering');
  carouselTrack.scrollTo({ left: carouselTrack.scrollLeft + offset, behavior: 'instant' });
  requestAnimationFrame(() => carouselTrack.classList.remove('is-recentering'));
}

function settleCarousel() {
  if (carouselCenterMotion || (carouselDrag && carouselDrag.moved)) return;
  syncCenteredProduct();
  requestedSlideIndex = selectedSlideIndex;
  recenterCarousel();
}

function moveProduct(direction) {
  if (carouselProducts.length < 2) return;
  if (requestedSlideIndex + direction < 0 || requestedSlideIndex + direction >= carouselTrack.children.length) {
    syncCenteredProduct();
    recenterCarousel(true);
    requestedSlideIndex = selectedSlideIndex;
  }
  centerSlide(requestedSlideIndex + direction);
}

carouselTrack.addEventListener('scroll', () => {
  if (!carouselFrame) carouselFrame = requestAnimationFrame(syncCenteredProduct);
  clearTimeout(carouselSettleTimer);
  carouselSettleTimer = setTimeout(settleCarousel, 160);
}, { passive: true });
carouselTrack.addEventListener('scrollend', settleCarousel);
carouselTrack.addEventListener('click', event => {
  if (ignoreCarouselClick) { ignoreCarouselClick = false; return; }
  const button = event.target.closest('[data-carousel-select]');
  if (!button) return;
  const index = Number(button.dataset.slide);
  if (index === selectedSlideIndex) {
    // Freeze the chosen item's position before the dialog changes focus.
    centerSlide(index, 'instant');
    openPanel('quick', carouselProducts[selectedProductIndex].id);
  } else centerSlide(index);
});
carouselTrack.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    moveProduct(event.key === 'ArrowRight' ? 1 : -1);
  }
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    centerProduct(event.key === 'Home' ? 0 : carouselProducts.length - 1);
  }
});

// Vertical wheel movement belongs to the page; only dragging moves the track.
function applyCarouselDragPosition() {
  if (!carouselDrag || !carouselDrag.moved) return;
  const max = Math.max(0, carouselTrack.scrollWidth - carouselTrack.clientWidth);
  const target = Math.max(0, Math.min(max, carouselDrag.target));
  carouselTrack.scrollTo({ left: target, behavior: 'instant' });
}

function animateCarouselDrag() {
  carouselDragFrame = 0;
  // Follow the mouse once per rendered frame, without a delayed position target.
  applyCarouselDragPosition();
}

carouselTrack.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  cancelCarouselCentering();
  ignoreCarouselClick = false;
  carouselDrag = { x: event.clientX, scroll: carouselTrack.scrollLeft, target: carouselTrack.scrollLeft, moved: false, pointer: event.pointerId };
});
carouselTrack.addEventListener('pointermove', event => {
  if (!carouselDrag) return;
  const delta = event.clientX - carouselDrag.x;
  if (!carouselDrag.moved && Math.abs(delta) > 6) {
    carouselDrag.moved = true;
    carouselTrack.setPointerCapture(event.pointerId);
    carouselTrack.classList.add('is-dragging');
  }
  if (carouselDrag.moved) {
    carouselDrag.target = carouselDrag.scroll - delta;
    if (!carouselDragFrame) carouselDragFrame = requestAnimationFrame(animateCarouselDrag);
  }
});
function endCarouselDrag() {
  if (!carouselDrag) return;
  const pendingDragPosition = Boolean(carouselDragFrame);
  cancelAnimationFrame(carouselDragFrame);
  carouselDragFrame = 0;
  if (pendingDragPosition) applyCarouselDragPosition();
  // Settle the item nearest to the actual visible position, never a projected target.
  if (carouselDrag.moved) syncCenteredProduct();
  const drag = carouselDrag;
  const destination = closestSlide(carouselTrack.scrollLeft);
  carouselDrag = null;
  if (carouselTrack.hasPointerCapture(drag.pointer)) carouselTrack.releasePointerCapture(drag.pointer);
  if (drag.moved) {
    ignoreCarouselClick = true;
    centerSlide(destination);
  }
  // is-animating takes over before is-dragging is removed, with no snap gap.
  carouselTrack.classList.remove('is-dragging');
}
carouselTrack.addEventListener('pointerup', endCarouselDrag);
carouselTrack.addEventListener('pointercancel', endCarouselDrag);
carouselTrack.addEventListener('lostpointercapture', endCarouselDrag);
document.querySelector('#product-prev').addEventListener('click', () => moveProduct(-1));
document.querySelector('#product-next').addEventListener('click', () => moveProduct(1));
window.addEventListener('resize', () => centerSlide(selectedSlideIndex, 'instant'));
