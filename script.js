// script.js - Финальная версия со скрытием шапки на мобильных
document.addEventListener("DOMContentLoaded", () => {
    // ==================== ИНИЦИАЛИЗАЦИЯ THREE.JS ====================
    const container = document.getElementById("viewer-container");
    if (!container) {
        console.warn("⚠️ Контейнер для 3D не найден");
        return;
    }

    if (typeof THREE === "undefined") {
        console.error("❌ Three.js не загружен!");
        container.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                <p>Ошибка: Three.js не загружен</p>
            </div>
        `;
        return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    // Камера
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x556688, 0.5);
    backLight.position.set(-5, 0, -5);
    scene.add(backLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(0, 5, 0);
    scene.add(fillLight);

    // Орбитальное управление
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.target.set(0, 0, 0);

    // Загрузчик STL
    const loader = new THREE.STLLoader();
    let currentModel = null;
    let isLoading = false;
    let loadErrorShown = false;

    function loadSTL(url) {
        if (isLoading) return;
        isLoading = true;

        const indicator = document.querySelector(".loading-indicator");
        if (indicator) {
            indicator.style.display = "flex";
            const p = indicator.querySelector("p");
            if (p) p.textContent = "Загрузка модели...";
        }

        const errorDiv = document.getElementById("stl-error-message");
        if (errorDiv) errorDiv.style.display = "none";

        if (currentModel) {
            scene.remove(currentModel);
            if (currentModel.geometry) currentModel.geometry.dispose();
            if (currentModel.material) currentModel.material.dispose();
            currentModel = null;
        }

        loader.load(
            url,
            (geometry) => {
                geometry.computeBoundingBox();
                const box = geometry.boundingBox;
                if (!box) {
                    console.error("❌ Не удалось вычислить bounding box");
                    if (indicator) indicator.style.display = "none";
                    showLoadError();
                    isLoading = false;
                    return;
                }

                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = maxDim > 10 ? 10 / maxDim : 1;

                const material = new THREE.MeshPhongMaterial({
                    color: 0xc0d0e0,
                    shininess: 50,
                    specular: 0x555555,
                    side: THREE.DoubleSide,
                    // metalness и roughness удалены, так как они не поддерживаются MeshPhongMaterial
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // Масштабирование и центрирование
                mesh.scale.set(scale, scale, scale);
                mesh.position.copy(center).multiplyScalar(-scale);

                // Индивидуальные коррекции
                if (url.includes("rolgang.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.position.y += 5;
                    mesh.position.z += 6;
                }
                if (url.includes("opravka-dlya-pressa.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.scale.multiplyScalar(0.7);
                    mesh.position.z += 6;
                    mesh.position.y += 5;
                }
                if (url.includes("pech-na-otrabotke.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.scale.multiplyScalar(0.6);
                    mesh.position.z += 6;
                    mesh.position.y += 4;
                }
                if (url.includes("ploshchadka-pressa.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.position.y += 3;
                }
                if (url.includes("chasha-800-4-s-podstavkoj.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.scale.multiplyScalar(0.8);
                    mesh.position.y += 7;
                    mesh.position.z += 3;
                }
                if (url.includes("chasha-800-4-raznesennaya.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.scale.multiplyScalar(0.7);
                    mesh.position.y += 7;
                    mesh.position.z += 3;
                }
                if (url.includes("prigim_USP.stl")) {
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.scale.multiplyScalar(0.9);
                    mesh.position.y += -5;
                }

                scene.add(mesh);
                currentModel = mesh;

                camera.position.set(10, 10, 10);
                controls.target.set(0, 0, 0);
                controls.update();

                if (indicator) indicator.style.display = "none";
                console.log("✅ Модель успешно загружена:", url);
                isLoading = false;
            },
            (xhr) => {
                const percent = ((xhr.loaded / xhr.total) * 100).toFixed(0);
                const p = indicator?.querySelector("p");
                if (p) p.textContent = `Загрузка: ${percent}%`;
            },
            (error) => {
                console.error("❌ Ошибка загрузки STL:", url, error);
                if (indicator) indicator.style.display = "none";
                showLoadError();
                isLoading = false;
            }
        );
    }

    function showLoadError() {
        container.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 3rem;"></i>
                <p>Ошибка загрузки модели</p>
                <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem;">Проверьте путь к файлу</p>
            </div>
        `;

        const errorDiv = document.getElementById("stl-error-message");
        if (errorDiv && !loadErrorShown) {
            errorDiv.style.display = "flex";
            loadErrorShown = true;
        }
    }

    // Загружаем первую модель по умолчанию
    const stlSelect = document.getElementById("stl-select");
    if (stlSelect) {
        const defaultUrl = stlSelect.value;
        console.log("🔄 Загрузка модели по умолчанию:", defaultUrl);
        loadSTL(defaultUrl);

        stlSelect.addEventListener("change", (e) => {
            console.log("🔄 Выбор новой модели:", e.target.value);
            loadSTL(e.target.value);
        });
    } else {
        console.error("❌ Select для STL не найден");
    }

    // Сброс вида
    const resetBtn = document.getElementById("reset-view");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            camera.position.set(5, 5, 10);
            controls.target.set(0, 0, 0);
            controls.update();

            resetBtn.style.transform = "scale(0.95)";
            setTimeout(() => {
                resetBtn.style.transform = "";
            }, 150);

            console.log("🔄 Вид сброшен");
        });
    }

    // Анимация
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Обработка изменения размера окна
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    setTimeout(() => onWindowResize(), 100);

    // ==================== ФИКСИРОВАННАЯ НАВИГАЦИЯ ====================
    const header = document.querySelector(".header");
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    }

    // ==================== УЛУЧШЕННАЯ ПОДСВЕТКА МЕНЮ ====================
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav a");

    function setActiveLink() {
        const scrollPosition = window.scrollY + 120; // смещение для учёта шапки

        let closestSection = null;
        let closestDistance = Infinity;

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                closestSection = section;
                closestDistance = 0;
            } else {
                const distance = Math.abs(scrollPosition - sectionTop);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSection = section;
                }
            }
        });

        if (closestSection) {
            const currentId = closestSection.getAttribute("id");
            navLinks.forEach((link) => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${currentId}`) {
                    link.classList.add("active");
                }
            });
        }
    }

    window.addEventListener("scroll", setActiveLink);
    window.addEventListener("resize", setActiveLink);
    setActiveLink(); // сразу при загрузке

    // ==================== ПЛАВНАЯ ПРОКРУТКА ====================
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (href !== "#") {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    // Снять активный класс со всех ссылок
                    navLinks.forEach(link => link.classList.remove("active"));
                    // Добавить активный класс текущей ссылке
                    this.classList.add("active");

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });

                    // Принудительно показать шапку на мобильных (если скрыта)
                    forceShowHeader();
                }
            }
        });
    });

    // ==================== АНИМАЦИЯ ПОЯВЛЕНИЯ ====================
    const fadeElements = document.querySelectorAll(
        ".job, .edu-item, .course-item, .web-app-card, .naks-badge, .metric-card"
    );

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px",
        }
    );

    fadeElements.forEach((el) => {
        el.classList.add("fade-in");
        observer.observe(el);
    });

    // ==================== КНОПКА "НАВЕРХ" ====================
    const scrollUpBtn = document.getElementById("scrollUp");
    const scrollThreshold = 500;

    if (scrollUpBtn) {
        window.addEventListener("scroll", () => {
            if (window.pageYOffset > scrollThreshold) {
                scrollUpBtn.classList.add("visible");
            } else {
                scrollUpBtn.classList.remove("visible");
            }
        });

        scrollUpBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
            // Принудительно показать шапку
            forceShowHeader();
        });
    }

    // ==================== СКРЫТИЕ ШАПКИ НА МОБИЛЬНЫХ ====================
    (function() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScrollTop = 0;
        const scrollThresholdMobile = 50; // минимальная прокрутка для скрытия
        const isMobile = () => window.innerWidth <= 768;

        function getHeaderHeight() {
            const rootStyle = getComputedStyle(document.documentElement);
            const headerHeightValue = rootStyle.getPropertyValue('--header-height').trim();
            if (headerHeightValue) {
                return parseInt(headerHeightValue, 10);
            }
            // fallback
            return 280;
        }

        function updateBodyPadding(show) {
            if (show) {
                document.body.style.paddingTop = getHeaderHeight() + 'px';
            } else {
                document.body.style.paddingTop = '0';
            }
        }

        function handleScroll() {
            if (!isMobile()) {
                header.classList.remove('hidden');
                updateBodyPadding(true);
                return;
            }

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop && scrollTop > scrollThresholdMobile) {
                // Скролл вниз и прокрутили достаточно
                header.classList.add('hidden');
                updateBodyPadding(false);
            } else if (scrollTop < lastScrollTop || scrollTop <= scrollThresholdMobile) {
                // Скролл вверх или мы в самом верху
                header.classList.remove('hidden');
                updateBodyPadding(true);
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }

        function forceShowHeader() {
            if (!isMobile()) return;
            header.classList.remove('hidden');
            updateBodyPadding(true);
        }

        window.addEventListener('scroll', handleScroll, { passive: true });

        // При клике по ссылкам с якорем уже вызывается forceShowHeader выше в обработчике,
        // но добавим общий обработчик на случай других элементов
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', forceShowHeader);
        });

        if (scrollUpBtn) {
            scrollUpBtn.addEventListener('click', forceShowHeader);
        }

        window.addEventListener('resize', () => {
            if (!isMobile()) {
                header.classList.remove('hidden');
                updateBodyPadding(true);
            } else {
                handleScroll();
            }
        });

        // Инициализация
        updateBodyPadding(true);
    })();

    // ==================== КОНСОЛЬ ПРИВЕТСТВИЯ ====================
    console.log("%c👋 Привет!", "font-size: 20px; font-weight: bold; color: #4f46e5;");
    console.log("%cРезюме Алексея Щемелева — Инженер-технолог", "font-size: 14px; color: #64748b;");
    console.log("%cСвяжитесь: shemelevaleksei@gmail.com", "font-size: 12px; color: #94a3b8;");
});
