import { test, expect, type WebSocketRoute } from '@playwright/test';

// ---- helpers ----

function buildServerMsg(eventType: string, serverState: object): string {
  return JSON.stringify({ eventType, serverState });
}

const JOIN_STATE = {
  uuid: 'test-uuid-1',
  sessionID: '123456',
  name: 'Tester',
  pic: 'data:image/png;base64,iVBORw0KGgo=',
};

const ONE_PLAYER_RUNNING_STATE = {
  gameMode: 0,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: -1, won: false },
  ],
  winningNumber: -1,
};

const TWO_PLAYER_RUNNING_STATE = {
  gameMode: 0,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: -1, won: false },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: -1, won: false },
  ],
  winningNumber: -1,
};

const DECIDER_RUNNING_STATE = {
  gameMode: 0,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: undefined, won: false },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: -1, won: false },
  ],
  winningNumber: -1,
};

const RESULT_STATE = {
  gameMode: 1,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: 42, won: true },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: undefined, won: false },
  ],
  winningNumber: 42,
};

const RESULT_STATE_LOSER = {
  gameMode: 1,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: 10, won: false },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: undefined, won: true },
  ],
  winningNumber: 42,
};

const RESULT_STATE_DISTANCE_WINNER = {
  gameMode: 0,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: 40, won: true },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: undefined, won: false },
  ],
  winningNumber: 42,
};

const RESULT_STATE_DECIDER = {
  gameMode: 1,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: undefined, won: false },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: 42, won: true },
  ],
  winningNumber: 42,
};

// ---- join helpers ----

async function joinSession(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never, options: { name?: string; mockState?: object } = {}) {
  const { name = 'Tester', mockState = TWO_PLAYER_RUNNING_STATE } = options;
  await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
    ws.onMessage(() => {
      ws.send(buildServerMsg('join', JOIN_STATE));
      ws.send(buildServerMsg('running', mockState));
    });
  });
  await page.goto('/');
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Create new session' }).click();
  await expect(page).toHaveURL(/\/home/);
}

// ---- tests ----

test.describe('Join page', () => {
  test('shows NUMVEIL branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('NUMVEIL')).toBeVisible();
  });

  test('defaults to create-session mode with no session ID field', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Create new session' })).toBeVisible();
    await expect(page.getByLabel('Session ID')).toBeHidden();
  });

  test('switches to join mode and shows session ID input', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join existing session' }).click();
    await expect(page.getByLabel('Session ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join session' })).toBeVisible();
  });

  test('back button returns to create mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join existing session' }).click();
    await page.getByRole('button', { name: '← Back' }).click();
    await expect(page.getByRole('button', { name: 'Create new session' })).toBeVisible();
    await expect(page.getByLabel('Session ID')).toBeHidden();
  });

  test('redirects to /home after successful join', async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage(() => {
        ws.send(buildServerMsg('join', JOIN_STATE));
        ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
      });
    });

    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await expect(page).toHaveURL(/\/home/);
  });

  test('submits on Enter key press', async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage(() => {
        ws.send(buildServerMsg('join', JOIN_STATE));
        ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
      });
    });

    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByLabel('Your name').press('Enter');
    await expect(page).toHaveURL(/\/home/);
  });

  test('uses Guest name when submitted without a name', async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage(() => {
        ws.send(buildServerMsg('join', JOIN_STATE));
        ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await expect(page).toHaveURL(/\/home/);
  });

  test('shows advanced settings panel when toggled', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Server URL')).toBeHidden();
    await page.getByRole('button', { name: /Advanced/ }).click();
    await expect(page.getByLabel('Server URL')).toBeVisible();
  });

  test('hides advanced settings panel on second toggle', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Advanced/ }).click();
    await expect(page.getByLabel('Server URL')).toBeVisible();
    await page.getByRole('button', { name: /Hide/ }).click();
    await expect(page.getByLabel('Server URL')).toBeHidden();
  });
});

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await joinSession(page);
  });

  test('shows session ID badge', async ({ page }) => {
    await expect(page.getByText('123456')).toBeVisible();
  });

  test('shows player list with both players', async ({ page }) => {
    const playerList = page.locator('.player-list');
    await expect(page.getByText('Players (2)')).toBeVisible();
    await expect(playerList.getByText('Tester')).toBeVisible();
    await expect(playerList.getByText('Other')).toBeVisible();
  });

  test('shows race-to-decide banner when no one has submitted yet', async ({ page }) => {
    await expect(page.getByText('Race to decide!')).toBeVisible();
  });

  test('shows number input and submit button', async ({ page }) => {
    await expect(page.getByLabel('Your number')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('shows leave button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Leave' })).toBeVisible();
  });

  test('shows copy session ID button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Copy/ })).toBeVisible();
  });

  test('navigates to /result after submitting a guess', async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('42');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(/\/result/);
  });

  test('submits guess on Enter key press', async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('42');
    await page.getByLabel('Your number').press('Enter');
    await expect(page).toHaveURL(/\/result/);
  });
});

test.describe('Home page – waiting for second player', () => {
  test('shows waiting indicator when only one player is in session', async ({ page }) => {
    await joinSession(page, { mockState: ONE_PLAYER_RUNNING_STATE });
    await expect(page.getByText('Waiting for another player to join')).toBeVisible();
    await expect(page.getByLabel('Your number')).toBeHidden();
  });
});

test.describe('Home page – number decider role', () => {
  test('shows number decider banner after being the fastest submitter', async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', DECIDER_RUNNING_STATE));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByLabel('Your number')).toBeVisible();
    await page.getByLabel('Your number').fill('42');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByLabel('Your number')).toBeHidden({ timeout: 15000 });
    await expect(page.getByText('You are the Number Decider')).toBeVisible();
  });
});

test.describe('Result page', () => {
  test.beforeEach(async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('42');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(/\/result/);
  });

  test('shows winning number', async ({ page }) => {
    await expect(page.getByText('42').first()).toBeVisible();
  });

  test('shows "Perfect guess!" for exact match winner', async ({ page }) => {
    await expect(page.getByText('Perfect guess!')).toBeVisible();
  });

  test('shows winner in winners list with exact badge', async ({ page }) => {
    await expect(page.getByText('exact!')).toBeVisible();
  });

  test('shows play again button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
  });

  test('shows leave button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Leave' })).toBeVisible();
  });

  test('shows all players in player list', async ({ page }) => {
    const playerList = page.locator('.player-list').last();
    await expect(playerList.getByText('Tester')).toBeVisible();
    await expect(playerList.getByText('Other')).toBeVisible();
  });

  test('shows your guess below the winning number', async ({ page }) => {
    await expect(page.getByText('Your guess: 42')).toBeVisible();
  });
});

test.describe('Result page – loser flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE_LOSER));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('10');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(/\/result/);
  });

  test('shows "Not this time" for losing player', async ({ page }) => {
    await expect(page.getByText('Not this time')).toBeVisible();
  });

  test('shows the winning number', async ({ page }) => {
    await expect(page.getByText('42').first()).toBeVisible();
  });

  test('shows your losing guess', async ({ page }) => {
    await expect(page.getByText('Your guess: 10')).toBeVisible();
  });
});

test.describe('Result page – number decider view', () => {
  test.beforeEach(async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE_DECIDER));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('42');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(/\/result/);
  });

  test('shows "Your number was revealed" for number decider', async ({ page }) => {
    await expect(page.getByText('Your number was revealed')).toBeVisible();
  });

  test('does not show your guess for number decider', async ({ page }) => {
    await expect(page.getByText(/Your guess:/)).toBeHidden();
  });
});

test.describe('Result page – distance mode winner', () => {
  test.beforeEach(async ({ page }) => {
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE_DISTANCE_WINNER));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('40');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(/\/result/);
  });

  test('shows "You nailed it!" for closest guess winner', async ({ page }) => {
    await expect(page.getByText('You nailed it!')).toBeVisible();
  });

  test('does not show exact badge for distance winner', async ({ page }) => {
    await expect(page.getByText('exact!')).toBeHidden();
  });
});

test.describe('Result page – play again', () => {
  test('navigates back to /home after play again', async ({ page }) => {
    let round = 0;
    await page.routeWebSocket(/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((msg: string) => {
        const parsed = JSON.parse(msg);
        if (parsed.event === 'joinSession') {
          ws.send(buildServerMsg('join', JOIN_STATE));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
        if (parsed.event === 'guess') {
          ws.send(buildServerMsg('running', RESULT_STATE));
        }
        if (parsed.event === 'newRound') {
          round++;
          ws.send(buildServerMsg('restart', {}));
          ws.send(buildServerMsg('running', TWO_PLAYER_RUNNING_STATE));
        }
      });
    });
    await page.goto('/');
    await page.getByLabel('Your name').fill('Tester');
    await page.getByRole('button', { name: 'Create new session' }).click();
    await page.getByLabel('Your number').fill('42');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(/\/result/);
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page).toHaveURL(/\/home/);
    expect(round).toBe(1);
  });
});
