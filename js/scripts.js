'use strict';

document.documentElement.classList.add('js-enabled');

const NAVIGATION_SCROLL_OFFSET = 40;
const BACK_TO_TOP_SCROLL_OFFSET = 400;
const RIPPLE_DURATION_MS = 550;
const FORM_SENDING_DURATION_MS = 1800;
const SUCCESS_MESSAGE_DURATION_MS = 5000;
const MOBILE_MENU_BREAKPOINT = 860;
const MINIMUM_MESSAGE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORD_REVEAL_START = 0.85;
const WORD_REVEAL_END = 0.5;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const siteNavigation = document.getElementById('siteNavigation');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu__link');
const backToTopButton = document.getElementById('backToTopButton');
const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-stagger');
const staggerGroups = document.querySelectorAll('.reveal-stagger');
const heroSection = document.getElementById('inicio');
const wordRevealElement = document.querySelector('[data-word-reveal]');
const animatedButtons = document.querySelectorAll('.btn, .back-to-top');
const contactForm = document.getElementById('contactForm');
const contactSubmitButton = document.getElementById('contactSubmitButton');
const contactSuccessMessage = document.getElementById('contactSuccessMessage');
const footerCurrentYear = document.getElementById('footerCurrentYear');
const projectsCarousel = document.getElementById('projectsCarousel');
const projectsTrack = document.getElementById('projectsTrack');
const projectSlides = document.querySelectorAll('.projects-carousel__slide');
const projectsPreviousButton = document.getElementById('projectsPreviousButton');
const projectsNextButton = document.getElementById('projectsNextButton');
const projectsDotsContainer = document.getElementById('projectsDots');
const submitButtonOriginalContent = contactSubmitButton ? contactSubmitButton.innerHTML : '';

const contactFields = [
	{
		input: document.getElementById('contactName'),
		error: document.getElementById('contactNameError'),
		isValid: (value) => value.length > 0,
		message: 'Informe seu nome.'
	},
	{
		input: document.getElementById('contactEmail'),
		error: document.getElementById('contactEmailError'),
		isValid: (value) => EMAIL_PATTERN.test(value),
		message: 'Informe um e-mail válido.'
	},
	{
		input: document.getElementById('contactMessage'),
		error: document.getElementById('contactMessageError'),
		isValid: (value) => value.length >= MINIMUM_MESSAGE_LENGTH,
		message: `A mensagem precisa ter pelo menos ${MINIMUM_MESSAGE_LENGTH} caracteres.`
	}
];

let revealWords = [];
let isScrollUpdateScheduled = false;
let projectsDots = [];
let currentProjectIndex = 0;
let isProjectsUpdateScheduled = false;

function updateScrollState() {
	const scrollPosition = window.scrollY;

	siteNavigation?.classList.toggle('scrolled', scrollPosition > NAVIGATION_SCROLL_OFFSET);
	backToTopButton?.classList.toggle('show', scrollPosition > BACK_TO_TOP_SCROLL_OFFSET);
}

function clamp(value, minimum, maximum) {
	return Math.min(Math.max(value, minimum), maximum);
}

function updateScrollProgress() {
	const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
	const pageProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
	const heroProgress = heroSection ? window.scrollY / heroSection.offsetHeight : 1;

	document.documentElement.style.setProperty('--scroll-progress', clamp(pageProgress, 0, 1).toFixed(4));
	document.documentElement.style.setProperty('--hero-progress', clamp(heroProgress, 0, 1).toFixed(4));
}

function splitIntoWords(element) {
	Array.from(element.childNodes).forEach((node) => {
		if (node.nodeType === Node.ELEMENT_NODE) {
			splitIntoWords(node);
			return;
		}

		if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) {
			return;
		}

		const fragment = document.createDocumentFragment();

		node.textContent.match(/^\s+|\S+\s*/g).forEach((part) => {
			if (!part.trim()) {
				fragment.append(part);
				return;
			}

			const word = document.createElement('span');

			word.className = 'reveal-word';
			word.textContent = part;
			fragment.append(word);
		});

		node.replaceWith(fragment);
	});
}

function updateWordReveal() {
	if (revealWords.length === 0) {
		return;
	}

	const bounds = wordRevealElement.getBoundingClientRect();
	const startLine = window.innerHeight * WORD_REVEAL_START;
	const endLine = window.innerHeight * WORD_REVEAL_END;
	const progress = clamp((startLine - bounds.top) / (startLine - endLine + bounds.height), 0, 1);
	const litWordsCount = Math.round(progress * revealWords.length);

	revealWords.forEach((word, index) => {
		word.classList.toggle('is-lit', index < litWordsCount);
	});
}

function updateScrollEffects() {
	updateScrollState();
	updateScrollProgress();
	updateWordReveal();
	isScrollUpdateScheduled = false;
}

function scheduleScrollEffects() {
	if (isScrollUpdateScheduled) {
		return;
	}

	isScrollUpdateScheduled = true;
	requestAnimationFrame(updateScrollEffects);
}

function startWordReveal() {
	if (!wordRevealElement || prefersReducedMotion) {
		return;
	}

	splitIntoWords(wordRevealElement);
	revealWords = Array.from(wordRevealElement.querySelectorAll('.reveal-word'));
}

function prepareStaggerGroups() {
	staggerGroups.forEach((group) => {
		Array.from(group.children).forEach((child, index) => {
			child.style.setProperty('--stagger-index', index);
		});
	});
}

function scrollToTop() {
	window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function setMobileMenuState(isOpen) {
	if (!mobileMenu || !mobileMenuToggle) {
		return;
	}

	mobileMenu.classList.toggle('open', isOpen);
	mobileMenu.setAttribute('aria-hidden', String(!isOpen));
	mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
	mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
	document.body.style.overflow = isOpen ? 'hidden' : '';
}

function toggleMobileMenu() {
	const isMenuOpen = mobileMenu?.classList.contains('open');

	setMobileMenuState(!isMenuOpen);
}

function closeMobileMenu() {
	setMobileMenuState(false);
}

function closeMobileMenuOnEscape(event) {
	if (event.key === 'Escape' && mobileMenu?.classList.contains('open')) {
		closeMobileMenu();
		mobileMenuToggle.focus();
	}
}

function closeMobileMenuOnDesktop() {
	if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
		closeMobileMenu();
	}
}

function handleResize() {
	closeMobileMenuOnDesktop();
	scheduleScrollEffects();
}

function revealElement(element) {
	element.classList.add('visible');
}

function handleRevealIntersection(entries, observer) {
	entries.forEach((entry) => {
		if (!entry.isIntersecting) {
			return;
		}

		revealElement(entry.target);
		observer.unobserve(entry.target);
	});
}

function startScrollAnimations() {
	if (prefersReducedMotion || !('IntersectionObserver' in window)) {
		revealElements.forEach(revealElement);
		return;
	}

	const revealObserver = new IntersectionObserver(handleRevealIntersection, {
		threshold: 0.1,
		rootMargin: '0px 0px -40px 0px'
	});

	revealElements.forEach((element) => revealObserver.observe(element));
}

function createButtonRipple(event) {
	if (prefersReducedMotion) {
		return;
	}

	const button = event.currentTarget;
	const buttonBounds = button.getBoundingClientRect();
	const rippleSize = Math.max(buttonBounds.width, buttonBounds.height);
	const ripple = document.createElement('span');

	ripple.className = 'button-ripple';
	ripple.style.width = `${rippleSize}px`;
	ripple.style.height = `${rippleSize}px`;
	ripple.style.left = `${event.clientX - buttonBounds.left - rippleSize / 2}px`;
	ripple.style.top = `${event.clientY - buttonBounds.top - rippleSize / 2}px`;

	button.appendChild(ripple);

	ripple.animate(
		[
			{ transform: 'scale(0)', opacity: 0.35 },
			{ transform: 'scale(2.2)', opacity: 0 }
		],
		{ duration: RIPPLE_DURATION_MS, easing: 'ease-out' }
	).onfinish = () => ripple.remove();
}

function getClosestProjectIndex() {
	let closestIndex = 0;
	let closestDistance = Infinity;

	projectSlides.forEach((slide, index) => {
		const distance = Math.abs(slide.offsetLeft - projectsTrack.scrollLeft);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestIndex = index;
		}
	});

	return closestIndex;
}

function updateProjectsCarousel() {
	currentProjectIndex = getClosestProjectIndex();
	isProjectsUpdateScheduled = false;

	projectSlides.forEach((slide, index) => {
		slide.inert = index !== currentProjectIndex;
	});

	projectsDots.forEach((dot, index) => {
		dot.setAttribute('aria-current', String(index === currentProjectIndex));
	});
}

function scheduleProjectsUpdate() {
	if (isProjectsUpdateScheduled) {
		return;
	}

	isProjectsUpdateScheduled = true;
	requestAnimationFrame(updateProjectsCarousel);
}

function goToProject(index) {
	const targetIndex = (index + projectSlides.length) % projectSlides.length;

	projectsTrack.scrollTo({
		left: projectSlides[targetIndex].offsetLeft,
		behavior: prefersReducedMotion ? 'auto' : 'smooth'
	});
}

function showPreviousProject() {
	goToProject(currentProjectIndex - 1);
}

function showNextProject() {
	goToProject(currentProjectIndex + 1);
}

function handleProjectsKeydown(event) {
	if (event.key === 'ArrowLeft') {
		event.preventDefault();
		showPreviousProject();
	}

	if (event.key === 'ArrowRight') {
		event.preventDefault();
		showNextProject();
	}
}

function createProjectDot(index) {
	const dot = document.createElement('button');

	dot.type = 'button';
	dot.className = 'projects-carousel__dot';
	dot.setAttribute('aria-label', `Ir para o projeto ${index + 1}`);
	dot.addEventListener('click', () => goToProject(index));
	projectsDotsContainer.appendChild(dot);

	return dot;
}

function startProjectsCarousel() {
	projectSlides.forEach((slide, index) => {
		slide.setAttribute('aria-label', `${index + 1} de ${projectSlides.length}`);
		projectsDots.push(createProjectDot(index));
	});

	projectsCarousel.classList.add('projects-carousel--ready');
	projectsTrack.addEventListener('scroll', scheduleProjectsUpdate, { passive: true });
	projectsCarousel.addEventListener('keydown', handleProjectsKeydown);
	projectsPreviousButton?.addEventListener('click', showPreviousProject);
	projectsNextButton?.addEventListener('click', showNextProject);
	updateProjectsCarousel();
}

function showFieldError(field) {
	field.input.classList.add('error');
	field.input.setAttribute('aria-invalid', 'true');
	field.error.textContent = field.message;
	field.error.classList.add('show');
}

function clearFieldError(field) {
	field.input.classList.remove('error');
	field.input.setAttribute('aria-invalid', 'false');
	field.error.textContent = '';
	field.error.classList.remove('show');
}

function validateContactForm() {
	let isFormValid = true;

	contactFields.forEach((field) => {
		clearFieldError(field);

		if (!field.isValid(field.input.value.trim())) {
			showFieldError(field);
			isFormValid = false;
		}
	});

	return isFormValid;
}

function setSubmitButtonSending(isSending) {
	contactSubmitButton.disabled = isSending;
	contactSubmitButton.innerHTML = isSending ? 'Enviando...' : submitButtonOriginalContent;
}

function hideSuccessMessage() {
	contactSuccessMessage.classList.remove('show');
}

function finishFormSubmission() {
	contactForm.reset();
	setSubmitButtonSending(false);
	contactSuccessMessage.classList.add('show');
	setTimeout(hideSuccessMessage, SUCCESS_MESSAGE_DURATION_MS);
}

function handleContactSubmit(event) {
	event.preventDefault();

	if (!validateContactForm()) {
		const firstInvalidField = contactFields.find((field) => field.input.classList.contains('error'));

		firstInvalidField.input.focus();
		return;
	}

	setSubmitButtonSending(true);
	setTimeout(finishFormSubmission, FORM_SENDING_DURATION_MS);
}

function updateFooterYear() {
	if (footerCurrentYear) {
		footerCurrentYear.textContent = new Date().getFullYear();
	}
}

window.addEventListener('scroll', scheduleScrollEffects, { passive: true });
window.addEventListener('resize', handleResize);
document.addEventListener('keydown', closeMobileMenuOnEscape);
backToTopButton?.addEventListener('click', scrollToTop);
mobileMenuToggle?.addEventListener('click', toggleMobileMenu);
mobileMenuLinks.forEach((link) => link.addEventListener('click', closeMobileMenu));
animatedButtons.forEach((button) => button.addEventListener('pointerdown', createButtonRipple));

if (contactForm && contactSubmitButton && contactSuccessMessage && contactFields.every((field) => field.input && field.error)) {
	contactForm.addEventListener('submit', handleContactSubmit);
	contactFields.forEach((field) => {
		field.input.addEventListener('input', () => clearFieldError(field));
	});
}

if (projectsCarousel && projectsTrack && projectsDotsContainer && projectSlides.length > 0) {
	startProjectsCarousel();
}

startWordReveal();
prepareStaggerGroups();
updateScrollEffects();
updateFooterYear();
startScrollAnimations();