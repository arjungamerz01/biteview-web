/* ==========================================================
   BiteView
   app.js
   Part 1
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       ELEMENTS
    ========================================== */

    const navbar = document.querySelector(".navbar");

    const menuBtn = document.querySelector(".menu-btn");

    const navLinks = document.querySelector(".nav-links");

    const navItems = document.querySelectorAll(".nav-links a");


    /* ==========================================
       MOBILE MENU
    ========================================== */

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", () => {

            navLinks.classList.toggle("is-open");

            const expanded =
                menuBtn.getAttribute("aria-expanded") === "true";

            menuBtn.setAttribute(
                "aria-expanded",
                !expanded
            );

        });

    }


    /* ==========================================
       CLOSE MENU AFTER CLICK
    ========================================== */

    navItems.forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("is-open");

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });


    /* ==========================================
       CLICK OUTSIDE MENU
    ========================================== */

    document.addEventListener("click", (event) => {

        if (
            !navLinks.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {

            navLinks.classList.remove("is-open");

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });


    /* ==========================================
       SMOOTH SCROLL
    ========================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const target = document.querySelector(
                this.getAttribute("href")
            );

            if (!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        });

    });

        /* ==========================================
       NAVBAR SCROLL EFFECT
    ========================================== */

    const handleNavbar = () => {

        if (window.scrollY > 40) {

            navbar.classList.add("navbar-scrolled");

        } else {

            navbar.classList.remove("navbar-scrolled");

        }

    };

    handleNavbar();

    window.addEventListener("scroll", handleNavbar);



    /* ==========================================
       SCROLL REVEAL
    ========================================== */

    const revealElements = document.querySelectorAll(

        ".reveal, .reveal-left, .reveal-right, .fade-scale"

    );

    const revealObserver = new IntersectionObserver(

        (entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("active");

                    revealObserver.unobserve(entry.target);

                }

            });

        },

        {

            threshold: 0.12,

            rootMargin: "0px 0px -60px 0px"

        }

    );

    revealElements.forEach(el => {

        revealObserver.observe(el);

    });



    /* ==========================================
       ACTIVE NAVIGATION
    ========================================== */

    const sections = document.querySelectorAll("section[id]");

    const updateActiveLink = () => {

        let current = "";

        sections.forEach(section => {

            const top = section.offsetTop - 140;

            const height = section.offsetHeight;

            if (

                window.scrollY >= top &&

                window.scrollY < top + height

            ) {

                current = section.id;

            }

        });

        navItems.forEach(link => {

            link.classList.remove("active");

            link.removeAttribute("aria-current");

            const href = link.getAttribute("href");

            if (href === "#" + current) {

                link.classList.add("active");

                link.setAttribute("aria-current", "page");

            }

        });

    };

    updateActiveLink();

    window.addEventListener("scroll", updateActiveLink);

        /* ==========================================
       HERO PARALLAX
    ========================================== */

    const hero = document.querySelector(".hero");

    if (hero) {

        window.addEventListener("mousemove", (e) => {

            const x = (e.clientX / window.innerWidth - 0.5) * 18;
            const y = (e.clientY / window.innerHeight - 0.5) * 18;

            requestAnimationFrame(() => {

                hero.style.setProperty("--mouse-x", `${x}px`);
                hero.style.setProperty("--mouse-y", `${y}px`);

            });

        });

    }



    /* ==========================================
       CARD TILT EFFECT
    ========================================== */

    const cards = document.querySelectorAll(

        ".glass-card, .dish-card, .feature-card, .restaurant-card"

    );

    cards.forEach(card => {

        card.addEventListener("mousemove", (e) => {

            const rect = card.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const rotateY = ((x / rect.width) - 0.5) * 8;
            const rotateX = ((y / rect.height) - 0.5) * -8;

            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-8px)
            `;

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "";

        });

    });



    /* ==========================================
       BUTTON RIPPLE
    ========================================== */

    document.querySelectorAll(

        ".primary-btn, .secondary-btn"

    ).forEach(button => {

        button.addEventListener("click", function (e) {

            const ripple = document.createElement("span");

            const rect = this.getBoundingClientRect();

            ripple.className = "ripple";

            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;

            this.appendChild(ripple);

            setTimeout(() => {

                ripple.remove();

            }, 600);

        });

    });



    /* ==========================================
       RESIZE
    ========================================== */

    window.addEventListener("resize", () => {

        navLinks.classList.remove("is-open");

        menuBtn.setAttribute("aria-expanded", "false");

    });



    /* ==========================================
       PAGE LOADED
    ========================================== */

    document.body.classList.add("loaded");

});

/* ==========================================================
   End of app.js
==========================================================*/