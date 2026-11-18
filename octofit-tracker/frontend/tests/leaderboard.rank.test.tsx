import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Leaderboard from '../src/components/Leaderboard.js';

describe('Leaderboard', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the rank supplied by the API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      leaderboard: [{ teamName: 'Octocats', totalPoints: 90, rank: 7 }],
    }), { status: 200 })));

    render(<Leaderboard />);

    await waitFor(() => expect(screen.getByText('Rank 7: Octocats - 90 points')).toBeInTheDocument());
  });
});
