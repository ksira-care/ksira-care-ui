import { MockAdminWorld } from './mock-admin-world';

describe('MockAdminWorld', () => {
  it('seeds a consistent world: every booking has a client, and held hours are booked', () => {
    const world = new MockAdminWorld();

    expect(world.bookings.length).toBeGreaterThan(40);
    for (const booking of world.bookings) {
      expect(booking.client.name).toBeTruthy();
      if (booking.aaptaId && booking.outcome !== 'cancelled') {
        expect(world.hourState(booking.aaptaId, booking.start)).toBe('booked');
      }
    }
    expect(world.bookings.some((b) => !b.aaptaId && b.outcome === 'pending')).toBe(true);
  });
});
