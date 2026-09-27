// Número que vai receber o pedido no WhatsApp: 55 (Brasil) + DDD + número
const WHATSAPP_NUMERO = "5579988726547";

const modal = document.querySelector("#modal");
const dialog = document.querySelector(".dialog");
const form = document.querySelector("#booking-form");
const steps = [...document.querySelectorAll(".step")];
const progressItems = [...document.querySelectorAll(".progress-item")];
const progressLines = [...document.querySelectorAll(".progress i")];

const formArea = document.querySelector("#form-area");
const success = document.querySelector("#success");
const nextButton = document.querySelector("#next");
const backButton = document.querySelector("#back");
const sendButton = document.querySelector("#send");
const otherTheme = document.querySelector("#other-theme");

let currentStep = 1;
let opener = null;

/* ABRIR E FECHAR O FORMULÁRIO */

document.querySelectorAll(".open-modal").forEach(button => {
  button.addEventListener("click", () => {
    opener = button;

    form.reset();
    formArea.hidden = false;
    success.hidden = true;
    otherTheme.hidden = true;
    form.elements.temaPersonalizado.required = false;

    document.querySelectorAll(".error").forEach(error => {
      error.textContent = "";
    });

    showStep(1);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    form.elements.nome.focus();
  });
});

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  opener?.focus();
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", event => {
  if (modal.hidden) return;

  if (event.key === "Escape") {
    closeModal();
  }

  if (event.key !== "Tab") return;

  const focusable = [...dialog.querySelectorAll("button, input, textarea")]
    .filter(element => !element.disabled && element.getClientRects().length);

  if (event.shiftKey && document.activeElement === focusable[0]) {
    event.preventDefault();
    focusable.at(-1).focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === focusable.at(-1)
  ) {
    event.preventDefault();
    focusable[0].focus();
  }
});

/* ETAPAS DO FORMULÁRIO */

function showStep(number) {
  currentStep = number;

  steps.forEach((step, index) => {
    step.hidden = index !== number - 1;
  });

  progressItems.forEach((item, index) => {
    item.classList.toggle("active", index === number - 1);
    item.classList.toggle("done", index < number - 1);
  });

  progressLines.forEach((line, index) => {
    line.classList.toggle("done", index < number - 1);
  });

  backButton.hidden = number === 1;
  nextButton.hidden = number === 4;
  sendButton.hidden = number !== 4;

  document.querySelector("#send-error").textContent = "";
  dialog.scrollTop = 0;

  if (number === 4) {
    renderSummary();
  }
}

nextButton.addEventListener("click", () => {
  if (validateStep()) {
    showStep(currentStep + 1);
  }
});

backButton.addEventListener("click", () => {
  showStep(currentStep - 1);
});

function validateStep() {
  if (currentStep === 1) {
    for (const field of steps[0].querySelectorAll("input")) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    const phone = form.elements.whatsapp;

    if (phone.value.replace(/\D/g, "").length < 10) {
      phone.setCustomValidity("Digite o WhatsApp com DDD.");
      phone.reportValidity();
      return false;
    }
  }

  if (currentStep === 2) {
    const chosen = form.querySelector('input[name="tema"]:checked');
    const error = document.querySelector("#theme-error");

    if (!chosen) {
      error.textContent = "Escolha um tema para continuar.";
      return false;
    }

    if (
      chosen.value === "Outro" &&
      !form.elements.temaPersonalizado.value.trim()
    ) {
      error.textContent = "Digite o tema que você deseja.";
      form.elements.temaPersonalizado.focus();
      return false;
    }

    error.textContent = "";
  }

  if (
    currentStep === 3 &&
    !form.querySelector('input[name="kit"]:checked')
  ) {
    document.querySelector("#kit-error").textContent =
      "Escolha um kit para continuar.";
    return false;
  }

  return true;
}

/* TEMA PERSONALIZADO */

form.querySelectorAll('input[name="tema"]').forEach(input => {
  input.addEventListener("change", () => {
    const isOther = input.checked && input.value === "Outro";

    otherTheme.hidden = !isOther;
    form.elements.temaPersonalizado.required = isOther;
    document.querySelector("#theme-error").textContent = "";

    if (isOther) {
      form.elements.temaPersonalizado.focus();
    }
  });
});

form.querySelectorAll('input[name="kit"]').forEach(input => {
  input.addEventListener("change", () => {
    document.querySelector("#kit-error").textContent = "";
  });
});

/* WHATSAPP E DATA */

form.elements.whatsapp.addEventListener("input", event => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
  const prefix =
    digits.length > 2 ? `(${digits.slice(0, 2)}) ` : digits;

  const rest = digits.slice(2);
  const split = digits.length === 11 ? 5 : 4;

  event.target.value = digits.length <= 2
    ? prefix
    : prefix + (
        rest.length > split
          ? `${rest.slice(0, split)}-${rest.slice(split)}`
          : rest
      );

  event.target.setCustomValidity("");
});

const now = new Date();

form.elements.data.min =
  `${now.getFullYear()}-` +
  `${String(now.getMonth() + 1).padStart(2, "0")}-` +
  `${String(now.getDate()).padStart(2, "0")}`;

/* DADOS E RESUMO */

function formatDate(value) {
  return value
    ? value.split("-").reverse().join("/")
    : "Não informado";
}

function getData() {
  const theme =
    form.querySelector('input[name="tema"]:checked')?.value || "";

  return {
    nome: form.elements.nome.value.trim(),
    whatsapp: form.elements.whatsapp.value.trim(),
    email: form.elements.email.value.trim() || "Não informado",
    data: formatDate(form.elements.data.value),
    horario: form.elements.horario.value || "A combinar",
    local: form.elements.local.value.trim(),
    tema: theme === "Outro"
      ? form.elements.temaPersonalizado.value.trim()
      : theme,
    kit: form.querySelector('input[name="kit"]:checked')?.value || "",
    observacoes:
      form.elements.observacoes.value.trim() || "Nenhuma"
  };
}

function renderSummary() {
  const data = getData();

  const labels = {
    nome: "Nome",
    whatsapp: "WhatsApp",
    email: "E-mail",
    data: "Data da festa",
    horario: "Horário",
    local: "Local",
    tema: "Tema",
    kit: "Kit",
    observacoes: "Observações"
  };

  const summary = document.querySelector("#summary");
  summary.replaceChildren();

  for (const [key, label] of Object.entries(labels)) {
    const row = document.createElement("div");
    const name = document.createElement("span");
    const value = document.createElement("strong");

    row.className = "summary-row";
    name.textContent = label;
    value.textContent = data[key];

    row.append(name, value);
    summary.append(row);
  }
}

/* ENVIAR PEDIDO PARA O WHATSAPP */

form.addEventListener("submit", event => {
  event.preventDefault();

  if (currentStep !== 4) return;

  const data = getData();

  const message = [
    "NOVO PEDIDO DE AGENDAMENTO",
    "",
    "CLIENTE",
    `Nome: ${data.nome}`,
    `WhatsApp: ${data.whatsapp}`,
    `E-mail: ${data.email}`,
    "",
    "FESTA",
    `Data: ${data.data}`,
    `Horário: ${data.horario}`,
    `Local: ${data.local}`,
    `Tema: ${data.tema}`,
    `Kit: ${data.kit}`,
    `Observações: ${data.observacoes}`,
    "",
    "Aguardando confirmação de disponibilidade."
  ].join("\n");

  // Abre o WhatsApp (app no celular, WhatsApp Web no computador) já
  // com a mensagem pronta. A pessoa só precisa apertar enviar (➤)
  // dentro do próprio WhatsApp — o navegador não pode enviar sozinho.
  const link =
    `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(message)}`;

  window.open(link, "_blank");

  formArea.hidden = true;
  success.hidden = false;
  dialog.scrollTop = 0;
  confetti();
});

/* CONFETES */

function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const layer = document.querySelector("#confetti");
  const colors = [
    "#a33abb",
    "#f2a6dd",
    "#ffd170",
    "#86d7cf",
    "#ffffff"
  ];

  for (let i = 0; i < 85; i++) {
    const piece = document.createElement("span");

    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty(
      "--duration",
      `${3 + Math.random() * 2.5}s`
    );
    piece.style.animationDelay = `${Math.random() * .75}s`;

    layer.append(piece);
    setTimeout(() => piece.remove(), 6500);
  }
}

/* CARROSSEL */

const track = document.querySelector("#carousel-track");
const slides = [...track.children];
const dots = document.querySelector("#carousel-dots");
const viewport = document.querySelector("#carousel-viewport");

let activeSlide = 0;
let carouselTimer;
let touchStart = null;

slides.forEach((_, index) => {
  const dot = document.createElement("button");

  dot.type = "button";
  dot.setAttribute("aria-label", `Mostrar imagem ${index + 1}`);
  dot.addEventListener("click", () => goToSlide(index));

  dots.append(dot);
});

function goToSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  track.style.transform =
    `translateX(-${activeSlide * 100}%)`;

  [...dots.children].forEach((dot, index) => {
    dot.classList.toggle("active", index === activeSlide);
    dot.setAttribute(
      "aria-current",
      index === activeSlide ? "true" : "false"
    );
  });
}

function pauseCarousel() {
  clearInterval(carouselTimer);
}

function playCarousel() {
  pauseCarousel();

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  carouselTimer = setInterval(() => {
    goToSlide(activeSlide + 1);
  }, 5500);
}

document.querySelector("#slide-prev").addEventListener("click", () => {
  goToSlide(activeSlide - 1);
  playCarousel();
});

document.querySelector("#slide-next").addEventListener("click", () => {
  goToSlide(activeSlide + 1);
  playCarousel();
});

viewport.addEventListener("touchstart", event => {
  touchStart = event.changedTouches[0].screenX;
}, { passive: true });

viewport.addEventListener("touchend", event => {
  if (touchStart === null) return;

  const distance =
    event.changedTouches[0].screenX - touchStart;

  if (Math.abs(distance) > 45) {
    goToSlide(
      activeSlide + (distance < 0 ? 1 : -1)
    );
  }

  touchStart = null;
  playCarousel();
}, { passive: true });

document.querySelector(".carousel")
  .addEventListener("mouseenter", pauseCarousel);

document.querySelector(".carousel")
  .addEventListener("mouseleave", playCarousel);

document.querySelector(".carousel")
  .addEventListener("focusin", pauseCarousel);

document.querySelector(".carousel")
  .addEventListener("focusout", event => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      playCarousel();
    }
  });

document.addEventListener("visibilitychange", () => {
  document.hidden ? pauseCarousel() : playCarousel();
});

goToSlide(0);
playCarousel();

/* =========================================================
   SCROLL REVEAL
   Cada elemento anima uma vez e permanece visível
   ========================================================= */

const revealItems = document.querySelectorAll(".reveal");

const reduceMotion = matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");

        // Para de observar: a animação não se repete.
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: .1,
    rootMargin: "0px 0px -6% 0px"
  });

  revealItems.forEach(item => observer.observe(item));
} else {
  // Movimento reduzido ou navegador sem IntersectionObserver.
  revealItems.forEach(item => item.classList.add("visible"));
}
/* ANIMAÇÃO DOS TEXTOS — ACONTECE UMA ÚNICA VEZ */
const textSelectors = [
  ".hero .brand strong",
  ".hero .brand small",
  ".hero .eyebrow",
  ".hero h1",
  ".hero-content p",
  ".hero-content > small",
  ".hero-corner",

  ".showcase .section-kicker",
  ".showcase .section-heading h2",
  ".showcase .section-heading p",
  ".carousel-slide figcaption span",
  ".carousel-slide figcaption strong",
  ".showcase-footer span",
  ".showcase-footer a",

  ".experience .section-kicker",
  ".experience-copy h2",
  ".experience-copy > p",
  ".info-card h3",
  ".info-card p",
  ".footer strong",
  ".footer a",

  ".modal .step h2",
  ".modal .step .description",
  ".modal .fields label",
  ".modal .theme strong",
  ".modal .kit strong",
  ".modal .kit-desc",
  ".modal .kit-items li",
  ".modal .extra",
  ".modal .hint",
  ".modal .success h2",
  ".modal .success p"
];

const animatedTexts = document.querySelectorAll(
  textSelectors.join(",")
);

animatedTexts.forEach((element, index) => {
  element.classList.add("text-rise");
  element.style.setProperty(
    "--text-delay",
    `${(index % 4) * 90}ms`
  );
});

const reduceTextMotion = matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (!reduceTextMotion && "IntersectionObserver" in window) {
  const textObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      textObserver.unobserve(entry.target);
    });
  }, {
    threshold: .1,
    rootMargin: "0px 0px -5% 0px"
  });

  animatedTexts.forEach(element => {
    textObserver.observe(element);
  });
} else {
  animatedTexts.forEach(element => {
    element.classList.add("is-visible");
  });
}

/* ANIMAÇÃO DAS IMAGENS E ÍCONES — ACONTECE UMA ÚNICA VEZ
   (fotos do carrossel, ícones de tema, ícones de kit, selos de etapa
   e os ícones dos passos "Como funciona") */
const imageSelectors = [
  ".carousel-slide img",
  ".theme img",
  ".theme-emoji",
  ".kit-photo",
  ".step-icon",
  ".success-icon",
  ".info-card b"
];

const animatedImages = document.querySelectorAll(
  imageSelectors.join(",")
);

animatedImages.forEach((element, index) => {
  element.classList.add("img-rise");
  element.style.setProperty(
    "--img-delay",
    `${(index % 4) * 100}ms`
  );
});

const reduceImageMotion = matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (!reduceImageMotion && "IntersectionObserver" in window) {
  const imageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      imageObserver.unobserve(entry.target);
    });
  }, {
    threshold: .1,
    rootMargin: "0px 0px -5% 0px"
  });

  animatedImages.forEach(element => {
    imageObserver.observe(element);
  });
} else {
  animatedImages.forEach(element => {
    element.classList.add("is-visible");
  });
}