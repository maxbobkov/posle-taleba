(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const cfg = window.WEBINAR_CONFIG || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const numberFormat = new Intl.NumberFormat("ru-RU");
  const currency = cfg.currency || "₽";
  const money = (value) => `${numberFormat.format(Math.round(Number(value) || 0))}\u00a0${currency}`;

  const price = Number(cfg.price) || 30000;
  const earlyPrice = Number(cfg.earlyPrice) || Math.round(price * 0.9);

  const offerEnds = cfg.offerEndsISO ? new Date(cfg.offerEndsISO) : null;
  const offerEndsValid = offerEnds instanceof Date && !Number.isNaN(offerEnds.getTime());

  let isExpired = false;
  let countdownTimer = null;

  const setText = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  setText("[data-date-label]", cfg.dateLabel);
  setText("[data-time-label]", cfg.timeLabel);
  setText("[data-time-short]", cfg.timeShort);
  setText("[data-offer-label]", cfg.offerLabel);
  setText("[data-offer-deadline]", cfg.offerDeadline);

  function applyPrices(expired) {
    const current = expired ? price : earlyPrice;
    document.querySelectorAll("[data-old-price]").forEach((el) => {
      el.textContent = money(price);
    });
    document.querySelectorAll("[data-current-price]").forEach((el) => {
      el.textContent = money(current);
    });
    document.querySelectorAll("[data-cta-price]").forEach((el) => {
      el.textContent = money(current);
    });
    document.querySelectorAll("[data-success-amount]").forEach((el) => {
      el.textContent = money(current);
    });
  }

  function expireOffer() {
    if (isExpired) return;
    isExpired = true;
    document.body.classList.add("is-offer-expired");
    applyPrices(true);

    const priceNote = document.querySelector("[data-price-note]");
    if (priceNote) priceNote.hidden = true;

    const ctaDeadline = document.querySelector("[data-cta-deadline]");
    if (ctaDeadline) ctaDeadline.hidden = true;

    const finalPrice = document.querySelector("[data-final-price]");
    if (finalPrice) finalPrice.textContent = `${money(price)} за участника`;

    const registerTitle = document.querySelector("[data-register-title]");
    if (registerTitle) registerTitle.textContent = `Стоимость участия — ${money(price)}.`;

    const registerLead = document.querySelector("[data-register-lead]");
    if (registerLead) {
      registerLead.textContent = `Скидка 10% действовала до ${cfg.offerLabel || "6 ноября"}. Сейчас действует полная стоимость. Оставьте заявку — пришлём программу и условия оплаты.`;
    }

    const pricingLead = document.querySelector("[data-pricing-lead]");
    if (pricingLead) {
      pricingLead.textContent = `Полная стоимость участия — ${money(price)}. Набор на вебинар открыт — оставьте заявку, и мы пришлём программу.`;
    }

    const expiredMessage = document.querySelector(".countdown-expired");
    if (expiredMessage) {
      expiredMessage.textContent = `Специальная цена завершена. Действует полная стоимость — ${money(price)}.`;
    }

    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function renderCountdown() {
    if (!offerEndsValid) return;

    const diff = offerEnds.getTime() - Date.now();
    if (diff <= 0) {
      expireOffer();
      return;
    }

    const total = Math.floor(diff / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    const set = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = String(value).padStart(2, "0");
    };

    set("[data-days]", days);
    set("[data-hours]", hours);
    set("[data-minutes]", minutes);
    set("[data-seconds]", seconds);
  }

  applyPrices(false);

  if (offerEndsValid) {
    renderCountdown();
    if (!isExpired) {
      countdownTimer = window.setInterval(renderCountdown, 1000);
    }
  }

  /* ------------------------------------------------------------ chrome */

  const header = document.getElementById("siteHeader");
  const progress = document.getElementById("progress");
  const mobileCta = document.getElementById("mobileCta");
  const registerSection = document.getElementById("register");
  const footer = document.querySelector(".footer");

  let scrollTicking = false;

  function updateMobileCta(y) {
    if (!mobileCta) return;

    const vh = window.innerHeight;
    const registerRect = registerSection ? registerSection.getBoundingClientRect() : null;
    const registerVisible = Boolean(
      registerRect && registerRect.top < vh * 0.92 && registerRect.bottom > vh * 0.08
    );

    const footerRect = footer ? footer.getBoundingClientRect() : null;
    const footerVisible = Boolean(footerRect && footerRect.top < vh);

    const shouldShow = y > vh * 0.75 && !registerVisible && !footerVisible;
    mobileCta.classList.toggle("is-visible", shouldShow);
  }

  function updateChrome() {
    const y = window.scrollY || window.pageYOffset || 0;

    if (header) header.classList.toggle("is-scrolled", y > 8);

    if (progress) {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = available > 0 ? Math.min(1, Math.max(0, y / available)) : 0;
      progress.style.width = `${(ratio * 100).toFixed(2)}%`;
    }

    updateMobileCta(y);
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateChrome();
      scrollTicking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateChrome();

  /* -------------------------------------------------------------- menu */

  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const navToggleText = navToggle ? navToggle.querySelector(".nav-toggle-text") : null;

  function setMenu(open) {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (navToggleText) navToggleText.textContent = open ? "Закрыть" : "Меню";
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      setMenu(mobileMenu.hidden);
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileMenu.hidden) {
        setMenu(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980 && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ------------------------------------------------------ privacy modal */

  const privacyDialog = document.getElementById("privacyDialog");

  if (privacyDialog && typeof privacyDialog.showModal === "function") {
    document.querySelectorAll("[data-open-privacy]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (!privacyDialog.open) privacyDialog.showModal();
      });
    });

    document.querySelectorAll("[data-close-privacy]").forEach((button) => {
      button.addEventListener("click", () => privacyDialog.close());
    });

    privacyDialog.addEventListener("click", (event) => {
      if (event.target === privacyDialog) privacyDialog.close();
    });
  }

  /* --------------------------------------------------------------- faq */

  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ------------------------------------------------------------ reveal */

  if (!reducedMotion && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(
      ".section-head, .program-head, .why-cards, .pullquote, .program-list, .outcomes, " +
      ".audience-cards, .disclaimer-line, .format-grid, .author-grid, .price-card, " +
      ".register-grid, .faq-list"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
    );

    targets.forEach((element) => {
      element.classList.add("reveal");
      observer.observe(element);
    });
  }

  /* -------------------------------------------------------------- form */

  const form = document.getElementById("leadForm");
  const formCard = document.getElementById("formCard");
  const formSuccess = document.getElementById("formSuccess");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = submitBtn ? submitBtn.querySelector(".submit-label") : null;
  const successName = document.querySelector("[data-success-name]");
  const successAmount = document.querySelector("[data-success-amount]");
  const successEyebrow = document.querySelector("[data-success-eyebrow]");
  const successCopy = document.querySelector("[data-success-copy]");
  const successDemo = document.querySelector("[data-success-demo]");
  const successNote = document.querySelector("[data-success-note]");
  const demoNote = document.querySelector("[data-demo-note]");

  const formMode = cfg.formMode === "server" ? "server" : "demo";

  if (formMode !== "server" && demoNote) demoNote.hidden = false;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldErrorElement(key) {
    return form ? form.querySelector(`[data-error-for="${key}"]`) : null;
  }

  function setFieldError(key, message) {
    if (!form) return;
    const errorEl = fieldErrorElement(key);
    if (errorEl) errorEl.textContent = message;

    const input = form.elements.namedItem(key);
    if (input && typeof input.setAttribute === "function") {
      input.setAttribute("aria-invalid", "true");
    }
  }

  function clearFieldError(key) {
    if (!form) return;
    const errorEl = fieldErrorElement(key);
    if (errorEl) errorEl.textContent = "";

    const input = form.elements.namedItem(key);
    if (input && typeof input.removeAttribute === "function") {
      input.removeAttribute("aria-invalid");
    }
  }

  function clearAllErrors() {
    if (!form) return;
    form.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
    });
    form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });
    if (formError) {
      formError.hidden = true;
      formError.textContent = "";
    }
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (submitLabel) submitLabel.textContent = loading ? "Отправляем…" : "Отправить заявку";
  }

  function showFormError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = false;
  }

  function showSuccess(payload) {
    if (!form || !formSuccess) return;

    const serverAmount = Number(payload && payload.amount);
    const amount = Number.isFinite(serverAmount) && serverAmount > 0
      ? serverAmount
      : (isExpired ? price : earlyPrice);

    const name = (payload && payload.name) || (form.elements.namedItem("name") || {}).value || "друг";

    if (successName) successName.textContent = String(name).trim();
    if (successAmount) successAmount.textContent = money(amount);

    const isDemo = Boolean(payload && payload.demo) || formMode !== "server";
    if (successEyebrow) successEyebrow.textContent = isDemo ? "Демо-режим" : "Заявка принята";
    if (successCopy) successCopy.hidden = isDemo;
    if (successDemo) successDemo.hidden = !isDemo;
    if (successNote) successNote.hidden = isDemo;

    form.hidden = true;
    formSuccess.hidden = false;
    formSuccess.focus({ preventScroll: true });
    formSuccess.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center"
    });

    if (mobileCta) mobileCta.classList.remove("is-visible");
    if (formCard) formCard.classList.add("is-success");
  }

  if (form) {
    form.addEventListener("input", (event) => {
      const target = event.target;
      if (target && target.name) clearFieldError(target.name);
      if (formError) {
        formError.hidden = true;
        formError.textContent = "";
      }
    });

    form.addEventListener("change", (event) => {
      const target = event.target;
      if (target && target.name) clearFieldError(target.name);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitBtn && submitBtn.disabled) return;

      clearAllErrors();

      const name = String((form.elements.namedItem("name") || {}).value || "").trim();
      const phone = String((form.elements.namedItem("phone") || {}).value || "").trim();
      const email = String((form.elements.namedItem("email") || {}).value || "").trim();
      const focusField = form.elements.namedItem("focus");
      const focus = focusField ? String(focusField.value || "") : "";
      const consentField = form.elements.namedItem("consent");
      const consent = Boolean(consentField && consentField.checked);
      const website = String((form.elements.namedItem("website") || {}).value || "");

      let valid = true;
      let firstInvalid = null;

      if (name.length < 2) {
        setFieldError("name", "Укажите имя и фамилию.");
        valid = false;
        firstInvalid = firstInvalid || "name";
      }

      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        setFieldError("phone", "Введите телефон в формате +7 999 000-00-00.");
        valid = false;
        firstInvalid = firstInvalid || "phone";
      }

      if (!emailPattern.test(email)) {
        setFieldError("email", "Введите корректный email.");
        valid = false;
        firstInvalid = firstInvalid || "email";
      }

      if (!consent) {
        setFieldError("consent", "Без согласия на обработку данных мы не можем принять заявку.");
        valid = false;
        firstInvalid = firstInvalid || "consent";
      }

      if (!valid) {
        if (firstInvalid) {
          const field = form.elements.namedItem(firstInvalid);
          if (field && typeof field.focus === "function") field.focus();
        }
        return;
      }

      if (formMode !== "server") {
        showSuccess({ name, amount: isExpired ? price : earlyPrice, demo: true });
        return;
      }

      setLoading(true);

      let response;
      try {
        response = await fetch(form.action, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            focus,
            consent,
            website
          })
        });
      } catch (error) {
        setLoading(false);
        showFormError("Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.");
        return;
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (!response.ok || !payload || !payload.ok) {
        setLoading(false);
        showFormError(
          (payload && payload.error) ||
          "Не удалось отправить заявку. Попробуйте ещё раз или напишите нам позже."
        );
        return;
      }

      setLoading(false);
      showSuccess(payload);
    });
  }
})();
