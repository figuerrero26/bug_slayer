document.addEventListener("DOMContentLoaded", () => {
    
    /* =========================================
       1. ANIMACIÓN DEL SLIDER (MENÚ)
       ========================================= */
    const items = document.querySelectorAll(".menu li");
    const slider = document.querySelector(".slider");
    const menu = document.querySelector(".menu");

    function moveSlider(element) {
        if (element && slider) {
            const rect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();

            slider.style.width = `${rect.width}px`;
            slider.style.left = `${rect.left - parentRect.left}px`;
        }
    }

    items.forEach(item => {
        item.addEventListener("mouseenter", () => {
            moveSlider(item);
        });

        item.addEventListener("click", () => {
            document.querySelector(".menu li.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });

    if (menu) {
        menu.addEventListener("mouseleave", () => {
            const activeItem = document.querySelector(".menu li.active");
            moveSlider(activeItem);
        });
    }

    window.addEventListener("load", () => {
        const activeItem = document.querySelector(".menu li.active");
        moveSlider(activeItem);
    });

    window.addEventListener("resize", () => {
        const activeItem = document.querySelector(".menu li.active");
        moveSlider(activeItem);
    });


    /* =========================================
       2. EFECTO DE MOUSE PARA LAS CARDS
       ========================================= */
    const cards = document.querySelectorAll(".card");
    const cardsContainer = document.querySelector(".cards-section");

    if (cardsContainer) {
        cardsContainer.addEventListener("mousemove", (e) => {
            cards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty("--x", `${x}px`);
                card.style.setProperty("--y", `${y}px`);
            });
        });
    }


    /* =========================================
       3. SCROLL REVEAL (NUEVO - TIPO APPLE)
       ========================================= */
    const reveals = document.querySelectorAll(".reveal");

    function revealOnScroll() {
        const windowHeight = window.innerHeight;

        reveals.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const revealPoint = 120;

            if (elementTop < windowHeight - revealPoint) {
                element.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Se ejecuta una vez al cargar


    /* =========================================
       4. TOGGLE MODO DÍA/NOCHE
       ========================================= */
    const toggle = document.querySelector(".day-night input");

    if (toggle) {
        toggle.addEventListener("change", () => {
            document.body.classList.add("toggle");
            setTimeout(() => {
                document.body.classList.toggle("light");
                setTimeout(() => {
                    document.body.classList.remove("toggle");
                }, 10);
            }, 5);
        });
    }
});