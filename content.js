//content.js
(function oneko() {
    let nekoState = {
        enabled: true,
        gif: 'assets/oneko/oneko-classic.gif'
    };

    let nekoSize = 38; // New variable to store neko size

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'updateState') {
            updateNekoState(message.state);
        }
    });

    chrome.runtime.sendMessage({action: 'getState'}, function(response) {
        updateNekoState(response);
    });

    function updateNekoState(newState) {
        nekoState.enabled = newState.enabled;
        nekoState.gif = `assets/oneko/${newState.gif}.gif`;
        
        if (nekoState.enabled) {
            init();
        } else {
            removeNeko();
        }
    }

    function removeNeko() {
        const nekoEl = document.getElementById('oneko');
        if (nekoEl) {
            nekoEl.remove();
        }
        clearInterval(window.onekoInterval);
    }

    function updateNekoGif() {
        const nekoEl = document.getElementById('oneko');
        if (nekoEl) {
            nekoEl.style.backgroundImage = `url(${chrome.runtime.getURL(nekoState.gif)})`;
        }
    }
    
    const nekoEl = document.createElement('div');
    let nekoPosX = window.innerWidth * 0.5,
    nekoPosY = 32,
    mousePosX = 0,
    mousePosY = 0,
    frameCount = 0,
    idleTime = 0,
    idleAnimation = null,
    idleAnimationFrame = 0,
    grabbing = false,
    grabStop = true,
    nudge = false,
    forceSleep = false,
    isCatFixed = false,
    targetX,
    targetY = 32;

    const nekoSpeed = 10,
    spriteSets = {
        idle: [[-3, -3]],
        alert: [[-7, -3]],
        scratchSelf: [
        [-5, 0],
        [-6, 0],
        [-7, 0],
        ],
        scratchWallN: [
        [0, 0],
        [0, -1],
        ],
        scratchWallS: [
        [-7, -1],
        [-6, -2],
        ],
        scratchWallE: [
        [-2, -2],
        [-2, -3],
        ],
        scratchWallW: [
        [-4, 0],
        [-4, -1],
        ],
        tired: [[-3, -2]],
        sleeping: [
        [-2, 0],
        [-2, -1],
        ],
        N: [
        [-1, -2],
        [-1, -3],
        ],
        NE: [
        [0, -2],
        [0, -3],
        ],
        E: [
        [-3, 0],
        [-3, -1],
        ],
        SE: [
        [-5, -1],
        [-5, -2],
        ],
        S: [
        [-6, -3],
        [-7, -2],
        ],
        SW: [
        [-5, -3],
        [-6, -1],
        ],
        W: [
        [-4, -2],
        [-4, -3],
        ],
        NW: [
        [-1, 0],
        [-1, -1],
        ],
    };

    function init() {
    removeNeko();
    nekoEl.id = 'oneko';
    nekoEl.title = 'meow:3';
    nekoEl.ariaHidden = true;
    nekoEl.style.width = '38px';
    nekoEl.style.height = '38px';
    nekoEl.style.position = 'fixed';
    nekoEl.style.pointerEvents = 'auto';
    nekoEl.style.imageRendering = 'pixelated';
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 1000000;
    nekoEl.style.cursor = 'grab';
    nekoEl.style.margin = '10px';
    nekoEl.style.content= ' ';

    nekoEl.style.backgroundImage = `url(${chrome.runtime.getURL(nekoState.gif)})`;
    nekoEl.style.backgroundSize = `${nekoSize * 8}px ${nekoSize * 4}px`; // Assuming the sprite sheet is 8x4 cells
    nekoEl.style.backgroundRepeat = 'no-repeat';

    document.body.appendChild(nekoEl);

    let lastTap = 0;
    
    nekoEl.addEventListener('dblclick', sleep);

    document.addEventListener('mousemove', function (event) {
        if (!isCatFixed) {
        mousePosX = event.clientX;
        mousePosY = event.clientY;
        }
    });

    nekoEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        nekoEl.style.cursor = 'grabbing';
        startDrag(e.clientX, e.clientY);
    });

    nekoEl.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
        sleep();
        e.preventDefault();
        } else {
        startDrag(touch.clientX, touch.clientY);
        }
        
        lastTap = currentTime;
        e.preventDefault();
    }, { passive: false })

    function startDrag(startX, startY) {
        grabbing = true;
        let startNekoX = nekoPosX;
        let startNekoY = nekoPosY;
        let grabInterval;
    
        const move = (e) => {
        const deltaX = (e.clientX || e.touches[0].clientX) - startX;
        const deltaY = (e.clientY || e.touches[0].clientY) - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
    
        if (absDeltaX > absDeltaY && absDeltaX > 10) {
            setSprite(deltaX > 0 ? 'scratchWallW' : 'scratchWallE', frameCount);
        } else if (absDeltaY > absDeltaX && absDeltaY > 10) {
            setSprite(deltaY > 0 ? 'scratchWallN' : 'scratchWallS', frameCount);
        }
    
        if (grabStop || absDeltaX > 10 || absDeltaY > 10 || Math.sqrt(deltaX ** 2 + deltaY ** 2) > 10) {
            grabStop = false;
            clearTimeout(grabInterval);
            grabInterval = setTimeout(() => {
            grabStop = true;
            nudge = false;
            startX = e.clientX || e.touches[0].clientX;
            startY = e.clientY || e.touches[0].clientY;
            startNekoX = nekoPosX;
            startNekoY = nekoPosY;
            }, 150);
        }
    
        nekoPosX = startNekoX + deltaX;
        nekoPosY = startNekoY + deltaY;
        nekoEl.style.left = `${nekoPosX - 16}px`;
        nekoEl.style.top = `${nekoPosY - 16}px`;
        };
    
        const end = () => {
        grabbing = false;
        nekoEl.style.cursor = 'grab';
        nudge = true;
        resetIdleAnimation();
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', end);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', end);
        };
    
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', end);
    }        

    window.onekoInterval = setInterval(frame, 100);
    }

    function sleep() {
    forceSleep = !forceSleep;
    isCatFixed = forceSleep;
    nudge = false;

    // localStorage.setItem('oneko:forceSleep', forceSleep);
    // if (!forceSleep) {
    //     resetIdleAnimation();
    //     return;
    // }
    }

    function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * nekoSize}px ${sprite[1] * nekoSize}px`;
    }

    function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
    }

    function idle() {
    idleTime += 0.5;

    if (idleTime >= 5 && Math.random() < 0.5 && idleAnimation === null) {
        const availableIdleAnimations = ['scratchSelf', 'tired'];
        idleAnimation = availableIdleAnimations[Math.floor(Math.random() * availableIdleAnimations.length)];
    } else if (idleTime >= 50) {
        const availableIdleAnimations = 'sleeping';
        idleAnimation = availableIdleAnimations;
    }
    if (forceSleep) {
        const availableIdleAnimations = 'sleeping';
        idleAnimation = availableIdleAnimations;
    }

    switch (idleAnimation) {
        case 'sleeping':
        if (idleAnimationFrame < 8) {
            setSprite('tired', 0);
        } else {
            setSprite('sleeping', Math.floor(idleAnimationFrame / 4));
        }
        break;
        case 'scratchSelf':
        case 'tired':
        if (Math.random() < 0.5) {
            setSprite(idleAnimation, idleAnimationFrame);
        }
        if (idleAnimationFrame > 20) {
            setSprite('idle', 0);
        }
        break;
        default:
        setSprite('idle', 0);
        break;
    }
    idleAnimationFrame += 1;
    }

    function frame() {
    frameCount += 1;
    targetX = window.innerWidth * 0.5;
    let diffX, diffY;
    if (isCatFixed) {
        diffX = nekoPosX - targetX;
        diffY = nekoPosY - targetY;
    } else {
        diffX = nekoPosX - mousePosX;
        diffY = nekoPosY - mousePosY;
    }
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
        idle();
        return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
        setSprite('alert', 0);
        // count down after being alerted before moving
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        return;
    }

    let direction;
    direction = diffY / distance > 0.5 ? 'N' : '';
    direction += diffY / distance < -0.5 ? 'S' : '';
    direction += diffX / distance > 0.5 ? 'W' : '';
    direction += diffX / distance < -0.5 ? 'E' : '';
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(nekoSize/2, nekoPosX), window.innerWidth - nekoSize/2);
    nekoPosY = Math.min(Math.max(nekoSize/2, nekoPosY), window.innerHeight - nekoSize/2);

    nekoEl.style.left = `${nekoPosX - nekoSize/2}px`;
    nekoEl.style.top = `${nekoPosY - nekoSize/2}px`;
    }
})();