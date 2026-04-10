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

const TWO_PLAYER_RUNNING_STATE = {
  gameMode: 0,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: -1, won: false },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: -1, won: false },
  ],
  winningNumber: -1,
};

const RESULT_STATE = {
  gameMode: 0,
  players: [
    { uuid: 'test-uuid-1', name: 'Tester', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: 42, won: true },
    { uuid: 'test-uuid-2', name: 'Other', pic: 'data:image/png;base64,iVBORw0KGgo=', guess: undefined, won: false },
  ],
  winningNumber: 42,
};

// ---- tests ----

test.describe('Join page', () => {
  test('shows NUMVEIL branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('NUMVEIL')).toBeVisible();
  });

  test('defaults to create-session mode with no session ID field', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Create new session' })).toBeVisible();
    await expect(page.getByLabel('Session ID')).not.toBeVisible();
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
    await expect(page.getByLabel('Session ID')).not.toBeVisible();
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
});

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
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

  test('shows session ID badge', async ({ page }) => {
    await expect(page.getByText('123456')).toBeVisible();
  });

  test('shows player list with both players', async ({ page }) => {
    await expect(page.getByText('Players (2)')).toBeVisible();
    await expect(page.getByText('Tester')).toBeVisible();
    await expect(page.getByText('Other')).toBeVisible();
  });

  test('shows race-to-decide banner when no one has submitted yet', async ({ page }) => {
    await expect(page.getByText('Race to decide!')).toBeVisible();
  });

  test('shows number input and submit button', async ({ page }) => {
    await expect(page.getByLabel('Your number')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('navigates to /result after submitting a guess', async ({ page }) => {
    // After the guess event the server sends a running update then the client navigates
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
});
