// Client carousel: the client cards are repeated end to end and the track is
// translated by an offset that wraps around one set width, so it loops forever.
const carousel = {
    viewport: null,
    track: null,
    clients: [],
    setWidth: 0,
    offset: 0,
    speed: 60,          // px per second
    hovering: false,
    pausedUntil: 0,
    nudge: null,
    lastTime: 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

function flipCard(card) {
    card.querySelector('.card-inner').classList.toggle('is-flipped');
}

// Load client data from JSON file and generate the client section
function loadClients() {
    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            carousel.clients = data;
            buildCarousel();
            requestAnimationFrame(stepCarousel);
        })
        .catch(error => console.error('Error loading client data:', error));
}

function appendClientSet(isClone) {
    carousel.clients.forEach(client => {
        const card = createClientCard(client);
        if (isClone) {
            card.setAttribute('aria-hidden', 'true');
            card.querySelectorAll('a').forEach(link => link.tabIndex = -1);
        }
        carousel.track.appendChild(card);
    });
}

function buildCarousel() {
    const { track, viewport, clients } = carousel;
    if (!clients.length) return;

    track.innerHTML = '';
    appendClientSet(false);
    appendClientSet(true);
    carousel.setWidth = track.children[clients.length].offsetLeft - track.children[0].offsetLeft;

    // Add more copies until there is no gap at the end on wide screens
    while (track.scrollWidth < carousel.setWidth + viewport.clientWidth) {
        appendClientSet(true);
    }
}

function nudgeCarousel(direction) {
    if (!carousel.setWidth) return;
    const step = carousel.setWidth / carousel.clients.length;
    const now = performance.now();
    carousel.nudge = { from: carousel.offset, to: carousel.offset + direction * step, start: now };
    carousel.pausedUntil = now + 5000;
}

function stepCarousel(time) {
    const dt = carousel.lastTime ? Math.min((time - carousel.lastTime) / 1000, 0.1) : 0;
    carousel.lastTime = time;

    if (carousel.nudge) {
        const t = Math.min((time - carousel.nudge.start) / 400, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        carousel.offset = carousel.nudge.from + (carousel.nudge.to - carousel.nudge.from) * eased;
        if (t === 1) carousel.nudge = null;
    } else if (!carousel.hovering && !carousel.reducedMotion && time > carousel.pausedUntil) {
        carousel.offset += carousel.speed * dt;
    }

    const width = carousel.setWidth;
    if (width) {
        const position = ((carousel.offset % width) + width) % width;
        if (!carousel.nudge) carousel.offset = position;
        carousel.track.style.transform = `translateX(${-position}px)`;
    }

    requestAnimationFrame(stepCarousel);
}

function initCarousel() {
    carousel.viewport = document.querySelector('.scroll-container');
    carousel.track = carousel.viewport.querySelector('.scroll-content');

    document.querySelector('.scroll-arrow.left').addEventListener('click', () => nudgeCarousel(-1));
    document.querySelector('.scroll-arrow.right').addEventListener('click', () => nudgeCarousel(1));

    carousel.viewport.addEventListener('mouseenter', () => carousel.hovering = true);
    carousel.viewport.addEventListener('mouseleave', () => carousel.hovering = false);
    carousel.viewport.addEventListener('touchstart', () => {
        carousel.pausedUntil = performance.now() + 10000;
    }, { passive: true });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(buildCarousel, 200);
    });

    loadClients();
}

function createClientCard(client) {
    const clientCard = document.createElement('div');
    clientCard.classList.add('client-card');
    clientCard.addEventListener('click', () => flipCard(clientCard));

    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');

    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');

    const clientLogo = document.createElement('img');
    clientLogo.src = client.logo;
    clientLogo.alt = client.client;
    clientLogo.classList.add('client-logo');

    cardFront.appendChild(clientLogo);

    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');

    client.projects.forEach(project => {
        const projectLink = document.createElement('a');
        projectLink.href = `portfolio.html?project=${encodeURIComponent(project.name)}`;
        projectLink.textContent = project.name;
        cardBack.appendChild(projectLink);
        cardBack.appendChild(document.createElement('br'));
    });

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    clientCard.appendChild(cardInner);
    return clientCard;
}

// Load team data from JSON file and generate the team section
function loadTeam() {
    fetch('team.json')
        .then(response => response.json())
        .then(data => {
            const managementContainer = document.getElementById('management').querySelector('.team-container');
            const boardContainer = document.getElementById('board-of-directors').querySelector('.team-container');
            const expertsContainer = document.getElementById('experts').querySelector('.experts-container');

            data.management.forEach(member => {
                const memberCard = createTeamMemberCard(member);
                managementContainer.appendChild(memberCard);
            });

            data.board_of_directors.forEach(member => {
                const memberCard = createBoardMemberCard(member);
                boardContainer.appendChild(memberCard);
            });

            data.experts.forEach(expert => {
                const expertCard = createExpertCard(expert);
                expertsContainer.appendChild(expertCard);
            });
        })
        .catch(error => console.error('Error loading team data:', error));
}

// Load portfolio data from JSON file and generate the portfolio section
function loadPortfolio() {
    fetch('portfolio_projects.json')
        .then(response => response.json())
        .then(data => {
            const ongoingContainer = document.getElementById('ongoing-projects');
            const completedContainer = document.getElementById('completed-projects');

            if (data.ongoing.length > 0) {
                data.ongoing.forEach(project => {
                    const projectCard = createProjectCard(project, 'ongoing');
                    ongoingContainer.appendChild(projectCard);
                });
            } else {
                ongoingContainer.style.display = 'none';
            }

            data.completed.forEach(project => {
                const projectCard = createProjectCard(project, 'completed');
                completedContainer.appendChild(projectCard);
            });

            // Check for query parameter and scroll to the project if exists
            const urlParams = new URLSearchParams(window.location.search);
            const projectName = urlParams.get('project');
            if (projectName) {
                setTimeout(() => {
                    const targetProject = document.querySelector(`[data-project-name="${projectName}"]`);
                    if (targetProject) {
                        targetProject.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            }
        })
        .catch(error => console.error('Error loading portfolio data:', error));
}

function createTeamMemberCard(member) {
    const card = document.createElement('div');
    card.classList.add('team-member');

    const image = document.createElement('img');
    image.src = member.image;
    image.alt = member.name;

    const name = document.createElement('h3');
    name.textContent = member.name;

    const position = document.createElement('h4');
    position.textContent = member.position;

    const contact = document.createElement('p');
    contact.textContent = member.contact;

    const bio = document.createElement('p');
    bio.textContent = member.bio;

    // card.appendChild(image);
    card.appendChild(name);
    card.appendChild(position);
    card.appendChild(contact);
    card.appendChild(bio);

    return card;
}

function createBoardMemberCard(member) {
    const card = document.createElement('div');
    card.classList.add('team-member');

    const image = document.createElement('img');
    image.src = member.image;
    image.alt = member.name;

    const name = document.createElement('h3');
    name.textContent = member.name;

    const position = document.createElement('h4');
    position.textContent = member.position;

    const contact = document.createElement('p');
    contact.textContent = member.contact;

    const bio = document.createElement('p');
    bio.textContent = member.bio;

    // card.appendChild(image);
    card.appendChild(name);
    card.appendChild(position);
    card.appendChild(contact);
    card.appendChild(bio);

    return card;
}

function createExpertCard(expert) {
    const card = document.createElement('div');
    card.classList.add('expert');

    const name = document.createElement('h4');
    name.textContent = expert.name;

    const field = document.createElement('p');
    field.textContent = expert.field;

    card.appendChild(name);
    card.appendChild(field);

    return card;
}

function createProjectCard(project, type) {
    const card = document.createElement('div');
    card.classList.add('project-card', type);
    card.dataset.projectName = project.projectName; // Add data attribute for scrolling

    const client = document.createElement('h3');
    client.textContent = `Client: ${project.client}`;
    card.appendChild(client);

    const projectName = document.createElement('p');
    projectName.innerHTML = `<strong>Project Name:</strong> ${project.projectName}`;
    card.appendChild(projectName);

    const duration = document.createElement('p');
    duration.innerHTML = `<strong>Project Duration:</strong> ${project.duration}`;
    card.appendChild(duration);

    const feature = document.createElement('p');
    feature.innerHTML = `<strong>Project Feature:</strong> ${project.feature}`;
    card.appendChild(feature);

    const methodology = document.createElement('p');
    methodology.innerHTML = `<strong>Methodology:</strong> ${project.methodology}`;
    card.appendChild(methodology);

    const team = document.createElement('p');
    team.innerHTML = `<strong>Team Mobilization:</strong> ${project.team}`;
    card.appendChild(team);

    const location = document.createElement('p');
    location.innerHTML = `<strong>Location:</strong> ${project.location}`;
    card.appendChild(location);

    return card;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.scroll-container')) {
        initCarousel();
    }

    if (document.getElementById('management')) {
        loadTeam();
    }

    if (document.getElementById('ongoing-projects')) {
        loadPortfolio();
    }

    // Menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('open');
    });
});

let slideIndex = 0;
showSlides();

function showSlides() {
    let slides = document.getElementsByClassName("mySlides");
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    slideIndex++;
    if (slideIndex > slides.length) {slideIndex = 1}    
    slides[slideIndex-1].style.display = "block";  
    setTimeout(showSlides, 3000); // Change image every 3 seconds
}

function plusSlides(n) {
    slideIndex += n;
    let slides = document.getElementsByClassName("mySlides");
    if (slideIndex < 1) {
        slideIndex = slides.length;
    }
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    slides[slideIndex-1].style.display = "block"; 
}

function loadScript(url) {
    const timestamp = new Date().getTime();
    const script = document.createElement('script');
    script.src = url + '?v=' + timestamp;
    document.body.appendChild(script);
}

// document.addEventListener('DOMContentLoaded', function() {
//     const policyCircles = document.querySelectorAll('.policy-circle');
//     const modal = document.getElementById('policyModal');
//     const form = document.getElementById('policyForm');
//     const policyFileInput = document.getElementById('policyFile');
  
//     policyCircles.forEach(circle => {
//       circle.addEventListener('click', function() {
//         const policyFile = this.getAttribute('data-policy');
//         policyFileInput.value = policyFile;
//         modal.style.display = 'block';
//       });
//     });
  
//     form.addEventListener('submit', function(e) {
//       e.preventDefault();
//       const name = document.getElementById('name').value;
//       const email = document.getElementById('email').value;
//       const policyFile = policyFileInput.value;
  
//       // Here you would typically send the data to the server
//       // For this example, we'll just log it and open the file
//       console.log('Name:', name);
//       console.log('Email:', email);
//       console.log('Policy File:', policyFile);
  
//       // Open the PDF file
//       window.open(policyFile, '_blank');
  
//       // Close the modal and reset the form
//       modal.style.display = 'none';
//       form.reset();
//     });
//   });
   