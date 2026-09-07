// Smooth scrolling for same-page section links
document.addEventListener("click", (event) => {
  const anchor = event.target.closest('a[href^="#"]');

  if (!anchor) {
    return;
  }

  const href = anchor.getAttribute("href");

  if (!href || href === "#") {
    return;
  }

  const targetId = href.slice(1);
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  event.preventDefault();

  target.scrollIntoView({
    behavior: "smooth"
  });
});


// =========================================================
// RENATUS RETRO COMPUTER
// SPACE-BAR MINI GAME
// =========================================================

(function setupRetroComputerGame() {

  const computer =
    document.querySelector(
      ".hero-retro .hero-computer"
    );

  const screen =
    computer?.querySelector(
      ".retro-screen"
    );


  if (
    !computer ||
    !screen ||
    computer.dataset.retroGameReady === "true"
  ) {
    return;
  }


  computer.dataset.retroGameReady =
    "true";


  // =======================================================
  // PRESERVE EXISTING RENATUS SCREEN
  // =======================================================

  const defaultScreen =
    document.createElement(
      "div"
    );

  defaultScreen.className =
    "retro-screen-default";


  while (
    screen.firstChild
  ) {
    defaultScreen.appendChild(
      screen.firstChild
    );
  }


  screen.appendChild(
    defaultScreen
  );


  // =======================================================
  // CREATE GAME SCREEN
  // =======================================================

  const game =
    document.createElement(
      "div"
    );


  game.className =
    "retro-game";

  game.hidden =
    true;


  game.setAttribute(
    "aria-label",
    "Renatus Bug Runner mini game"
  );


  game.innerHTML = `
    <div class="retro-game-topbar">

      <span>
        RENATUS ARCADE // BUG RUNNER
      </span>

      <button
        class="retro-game-exit"
        type="button"
        data-retro-exit
      >
        EXIT [ESC]
      </button>

    </div>


    <div
      class="retro-game-hud"
      aria-live="polite"
    >

      <span>
        SCORE
        <b data-retro-score>
          000
        </b>
      </span>

      <span>
        HIGH
        <b data-retro-high>
          000
        </b>
      </span>

    </div>


    <div
      class="retro-game-stage"
      data-retro-stage
    >

      <div
        class="retro-game-ground"
        aria-hidden="true"
      ></div>

      <div
        class="retro-game-runner"
        data-retro-runner
        aria-hidden="true"
      ></div>

      <div
        class="retro-game-obstacle"
        data-retro-obstacle
        aria-hidden="true"
      ></div>


      <div
        class="retro-game-message"
        data-retro-message
      >

        <strong>
          BUG RUNNER
        </strong>

        <span>
          Jump over production bugs.
          Space bar to begin.
        </span>

      </div>

    </div>


    <p class="retro-game-help">
      SPACE / CLICK = JUMP
      &nbsp;•&nbsp;
      ESC = RETURN TO RENATUS OS
    </p>
  `;


  screen.appendChild(
    game
  );


  // =======================================================
  // CREATE CLICKABLE PHYSICAL SPACE BAR
  // =======================================================

  const spacebar =
    document.createElement(
      "button"
    );


  spacebar.type =
    "button";


  spacebar.className =
    "retro-spacebar-button";


  spacebar.setAttribute(
    "aria-label",
    "Play the Renatus mini game using the computer space bar"
  );


  spacebar.innerHTML = `
    <span
      class="retro-spacebar-key"
      aria-hidden="true"
    ></span>
  `;


  computer.appendChild(
    spacebar
  );


  // =======================================================
  // GAME ELEMENTS
  // =======================================================

  const exitButton =
    game.querySelector(
      "[data-retro-exit]"
    );


  const stage =
    game.querySelector(
      "[data-retro-stage]"
    );


  const runner =
    game.querySelector(
      "[data-retro-runner]"
    );


  const obstacle =
    game.querySelector(
      "[data-retro-obstacle]"
    );


  const message =
    game.querySelector(
      "[data-retro-message]"
    );


  const scoreOutput =
    game.querySelector(
      "[data-retro-score]"
    );


  const highOutput =
    game.querySelector(
      "[data-retro-high]"
    );


  // =======================================================
  // GAME STATE
  // =======================================================

  const state = {

    active:
      false,

    running:
      false,

    gameOver:
      false,

    animationFrame:
      0,

    lastTime:
      0,

    score:
      0,

    highScore:
      readHighScore(),

    runnerY:
      0,

    velocityY:
      0,

    obstacleX:
      0,

    obstacleHeight:
      0,

    obstaclePassed:
      false,

    speed:
      0

  };


  highOutput.textContent =
    formatScore(
      state.highScore
    );


  // =======================================================
  // HIGH SCORE STORAGE
  // =======================================================

  function readHighScore() {

    try {

      return (
        Number.parseInt(
          localStorage.getItem(
            "renatusBugRunnerHigh"
          ) || "0",
          10
        ) || 0
      );

    } catch (error) {

      return 0;

    }

  }


  function saveHighScore(
    value
  ) {

    try {

      localStorage.setItem(
        "renatusBugRunnerHigh",
        String(
          value
        )
      );

    } catch (error) {

      /*
       * Browser storage may be blocked
       * in private/strict browsing.
       *
       * The game should still work.
       */

    }

  }


  function formatScore(
    value
  ) {

    return String(
      Math.max(
        0,
        value
      )
    )
      .padStart(
        3,
        "0"
      )
      .slice(
        -3
      );

  }


  // =======================================================
  // CRT SCREEN FLASH
  // =======================================================

  function flashScreen() {

    screen.classList.remove(
      "is-switching"
    );


    /*
     * Force reflow so the animation
     * can replay each time.
     */
    void screen.offsetWidth;


    screen.classList.add(
      "is-switching"
    );


    window.setTimeout(
      () => {

        screen.classList.remove(
          "is-switching"
        );

      },
      220
    );

  }


  // =======================================================
  // PHYSICAL KEY PRESS ANIMATION
  // =======================================================

  function pressKeyVisual() {

    spacebar.classList.add(
      "is-pressed"
    );


    window.setTimeout(
      () => {

        spacebar.classList.remove(
          "is-pressed"
        );

      },
      105
    );

  }


  // =======================================================
  // OPEN GAME
  // =======================================================

  function openGame() {

    if (
      state.active
    ) {
      return;
    }


    state.active =
      true;


    game.hidden =
      false;


    screen.classList.add(
      "is-game-active"
    );


    computer.classList.add(
      "is-game-active"
    );


    flashScreen();

    resetGame();


    message.hidden =
      false;


    message.innerHTML = `
      <strong>
        BUG RUNNER
      </strong>

      <span>
        Jump over production bugs.
        Hit the space bar again.
      </span>
    `;


    trackGameEvent(
      "retro_game_open"
    );

  }


  // =======================================================
  // CLOSE GAME
  // =======================================================

  function closeGame() {

    if (
      !state.active
    ) {
      return;
    }


    state.active =
      false;

    state.running =
      false;

    state.gameOver =
      false;


    cancelAnimationFrame(
      state.animationFrame
    );


    flashScreen();


    screen.classList.remove(
      "is-game-active"
    );


    computer.classList.remove(
      "is-game-active"
    );


    game.hidden =
      true;


    /*
     * Return focus to the physical
     * space bar without scrolling.
     */
    spacebar.focus({
      preventScroll: true
    });

  }


  // =======================================================
  // RESET GAME
  // =======================================================

  function resetGame() {

    cancelAnimationFrame(
      state.animationFrame
    );


    state.running =
      false;

    state.gameOver =
      false;

    state.lastTime =
      0;

    state.score =
      0;

    state.runnerY =
      0;

    state.velocityY =
      0;

    state.obstaclePassed =
      false;


    scoreOutput.textContent =
      formatScore(
        0
      );


    highOutput.textContent =
      formatScore(
        state.highScore
      );


    const dimensions =
      getStageDimensions();


    state.speed =
      Math.max(
        92,
        dimensions.width *
        0.42
      );


    state.obstacleX =
      dimensions.width *
      1.03;


    state.obstacleHeight =
      randomObstacleHeight(
        dimensions.height
      );


    renderGame();

  }


  // =======================================================
  // START GAME
  // =======================================================

  function startGame() {

    if (
      !state.active
    ) {

      openGame();

      return;

    }


    if (
      state.running
    ) {
      return;
    }


    resetGame();


    state.running =
      true;


    message.hidden =
      true;


    /*
     * The press that starts the game
     * also counts as the first jump.
     */
    jump();


    trackGameEvent(
      "retro_game_start"
    );


    state.animationFrame =
      requestAnimationFrame(
        gameLoop
      );

  }


  // =======================================================
  // GAME OVER
  // =======================================================

  function endGame() {

    state.running =
      false;


    state.gameOver =
      true;


    cancelAnimationFrame(
      state.animationFrame
    );


    if (
      state.score >
      state.highScore
    ) {

      state.highScore =
        state.score;


      saveHighScore(
        state.highScore
      );


      highOutput.textContent =
        formatScore(
          state.highScore
        );

    }


    message.hidden =
      false;


    message.innerHTML = `
      <strong>
        SYSTEM CRASHED
      </strong>

      <span>
        Score ${formatScore(
          state.score
        )}.
        Space bar to reboot.
      </span>
    `;


    trackGameEvent(
      "retro_game_over",
      {
        score:
          state.score
      }
    );

  }


  // =======================================================
  // JUMP
  // =======================================================

  function jump() {

    if (
      !state.running
    ) {
      return;
    }


    /*
     * No unlimited double jumping.
     */
    if (
      state.runnerY > 2
    ) {
      return;
    }


    const {
      height
    } =
      getStageDimensions();


    state.velocityY =
      Math.max(
        185,
        height *
        2.7
      );

  }


  // =======================================================
  // SPACE BAR ACTION
  // =======================================================

  function handleAction() {

    pressKeyVisual();


    if (
      !state.active
    ) {

      openGame();

      return;

    }


    if (
      !state.running
    ) {

      startGame();

      return;

    }


    jump();

  }


  // =======================================================
  // GAME LOOP
  // =======================================================

  function gameLoop(
    timestamp
  ) {

    if (
      !state.running
    ) {
      return;
    }


    if (
      !state.lastTime
    ) {

      state.lastTime =
        timestamp;

    }


    /*
     * Prevent huge physics jumps if the
     * browser tab goes inactive.
     */
    const delta =
      Math.min(
        (
          timestamp -
          state.lastTime
        ) /
        1000,

        0.033
      );


    state.lastTime =
      timestamp;


    updateGame(
      delta
    );


    renderGame();


    if (
      state.running
    ) {

      state.animationFrame =
        requestAnimationFrame(
          gameLoop
        );

    }

  }


  // =======================================================
  // UPDATE PHYSICS
  // =======================================================

  function updateGame(
    delta
  ) {

    const dimensions =
      getStageDimensions();


    const gravity =
      Math.max(
        520,
        dimensions.height *
        8.1
      );


    /*
     * Player physics
     */

    state.velocityY -=
      gravity *
      delta;


    state.runnerY +=
      state.velocityY *
      delta;


    if (
      state.runnerY <= 0
    ) {

      state.runnerY =
        0;


      state.velocityY =
        0;

    }


    /*
     * Slowly increase obstacle speed.
     */

    const difficultyMultiplier =
      1 +
      Math.min(
        state.score *
        0.035,
        0.7
      );


    state.obstacleX -=
      state.speed *
      difficultyMultiplier *
      delta;


    const obstacleWidth =
      getObstacleWidth();


    /*
     * Give one point when the bug
     * passes the player.
     */

    if (
      !state.obstaclePassed &&
      state.obstacleX +
      obstacleWidth <
      getRunnerX()
    ) {

      state.obstaclePassed =
        true;


      state.score +=
        1;


      scoreOutput.textContent =
        formatScore(
          state.score
        );

    }


    /*
     * Spawn the next bug.
     */

    if (
      state.obstacleX <
      -obstacleWidth -
      4
    ) {

      state.obstacleX =
        dimensions.width +
        randomRange(
          dimensions.width *
          0.28,

          dimensions.width *
          0.64
        );


      state.obstacleHeight =
        randomObstacleHeight(
          dimensions.height
        );


      state.obstaclePassed =
        false;

    }


    /*
     * Crash detection.
     */

    if (
      isColliding(
        dimensions
      )
    ) {

      endGame();

    }

  }


  // =======================================================
  // RENDER
  // =======================================================

  function renderGame() {

    runner.style.transform =
      `translateY(${
        -state.runnerY
      }px)`;


    obstacle.style.transform =
      `translateX(${
        state.obstacleX
      }px)`;


    obstacle.style.height =
      `${
        state.obstacleHeight
      }px`;

  }


  // =======================================================
  // DIMENSIONS
  // =======================================================

  function getStageDimensions() {

    const rect =
      stage.getBoundingClientRect();


    return {

      width:
        Math.max(
          rect.width,
          120
        ),

      height:
        Math.max(
          rect.height,
          70
        )

    };

  }


  function getRunnerX() {

    const stageWidth =
      getStageDimensions()
        .width;


    return (
      stageWidth *
      0.16
    );

  }


  function getRunnerWidth() {

    return (
      runner
        .getBoundingClientRect()
        .width ||
      12
    );

  }


  function getRunnerHeight() {

    return (
      runner
        .getBoundingClientRect()
        .height ||
      16
    );

  }


  function getObstacleWidth() {

    return (
      obstacle
        .getBoundingClientRect()
        .width ||
      12
    );

  }


  // =======================================================
  // RANDOM BUG HEIGHT
  // =======================================================

  function randomObstacleHeight(
    stageHeight
  ) {

    return randomRange(

      stageHeight *
      0.2,

      stageHeight *
      0.43

    );

  }


  function randomRange(
    min,
    max
  ) {

    return (
      min +
      Math.random() *
      (
        max -
        min
      )
    );

  }


  // =======================================================
  // COLLISION DETECTION
  // =======================================================

  function isColliding(
    dimensions
  ) {

    const runnerWidth =
      getRunnerWidth();


    const runnerHeight =
      getRunnerHeight();


    const obstacleWidth =
      getObstacleWidth();


    const runnerLeft =
      getRunnerX();


    const runnerRight =
      runnerLeft +
      runnerWidth;


    const obstacleLeft =
      state.obstacleX;


    const obstacleRight =
      obstacleLeft +
      obstacleWidth;


    const horizontalOverlap =
      runnerRight >
        obstacleLeft +
        1
      &&
      runnerLeft <
        obstacleRight -
        1;


    if (
      !horizontalOverlap
    ) {
      return false;
    }


    /*
     * CSS puts the ground 15%
     * above the bottom.
     */

    const groundY =
      dimensions.height *
      0.85;


    const runnerBottom =
      groundY -
      state.runnerY;


    const runnerTop =
      runnerBottom -
      runnerHeight;


    const obstacleBottom =
      groundY;


    const obstacleTop =
      obstacleBottom -
      state.obstacleHeight;


    return (
      runnerBottom >
        obstacleTop +
        2
      &&
      runnerTop <
        obstacleBottom -
        1
    );

  }


  // =======================================================
  // ANALYTICS
  // =======================================================

  function trackGameEvent(
    eventName,
    parameters = {}
  ) {

    if (
      typeof window.gtag !==
      "function"
    ) {
      return;
    }


    window.gtag(
      "event",
      eventName,
      parameters
    );

  }


  // =======================================================
  // CLICK THE PHYSICAL SPACE BAR
  // =======================================================

  spacebar.addEventListener(
    "click",
    handleAction
  );


  spacebar.addEventListener(
    "pointerdown",
    () => {

      spacebar.classList.add(
        "is-pressed"
      );

    }
  );


  [
    "pointerup",
    "pointercancel",
    "pointerleave"
  ].forEach(
    (
      eventName
    ) => {

      spacebar.addEventListener(
        eventName,
        () => {

          spacebar.classList.remove(
            "is-pressed"
          );

        }
      );

    }
  );


  // =======================================================
  // REAL KEYBOARD CONTROLS
  // =======================================================

  /*
   * Important:
   *
   * Space only gets intercepted after the
   * game has been opened.
   *
   * So normal page scrolling still works
   * before the user discovers the game.
   */

  document.addEventListener(
    "keydown",
    (
      event
    ) => {

      const target =
        event.target;


      const isTyping =

        target instanceof
          HTMLInputElement

        ||

        target instanceof
          HTMLTextAreaElement

        ||

        target instanceof
          HTMLSelectElement

        ||

        target?.isContentEditable;


      if (
        isTyping
      ) {
        return;
      }


      /*
       * ESC exits the game.
       */

      if (
        event.key ===
          "Escape"
        &&
        state.active
      ) {

        event.preventDefault();

        closeGame();

        return;

      }


      /*
       * Space only controls the game
       * if the game is open.
       */

      if (
        event.code !==
          "Space"
        ||
        !state.active
      ) {
        return;
      }


      event.preventDefault();


      /*
       * Don't rapid-fire from keyboard
       * key repeat.
       */

      if (
        event.repeat
      ) {
        return;
      }


      /*
       * Make photographed space bar
       * visually go down too.
       */

      spacebar.classList.add(
        "is-pressed"
      );


      if (
        !state.running
      ) {

        startGame();

      } else {

        jump();

      }

    }
  );


  document.addEventListener(
    "keyup",
    (
      event
    ) => {

      if (
        event.code ===
        "Space"
      ) {

        spacebar.classList.remove(
          "is-pressed"
        );

      }

    }
  );


  // =======================================================
  // EXIT BUTTON
  // =======================================================

  exitButton.addEventListener(
    "click",
    closeGame
  );


  // =======================================================
  // RESPONSIVE RESIZE HANDLING
  // =======================================================

  window.addEventListener(
    "resize",
    () => {

      if (
        !state.active
      ) {
        return;
      }


      resetGame();


      message.hidden =
        false;


      message.innerHTML = `
        <strong>
          DISPLAY RESIZED
        </strong>

        <span>
          Space bar to reboot the game.
        </span>
      `;

    }
  );

})();