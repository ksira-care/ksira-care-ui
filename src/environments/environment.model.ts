export interface Environment {
  /**
   * Where the browser sends API calls. Must be on the website's own domain
   * (ksiracare.com/api or api.ksiracare.com) or the session cookie is
   * treated as third-party and blocked by Safari.
   */
  readonly apiBaseUrl: string;
  /**
   * Whether the booking form takes payment (Razorpay). While off, "Confirm
   * booking" books straight away, so the team can test with real bookings.
   */
  readonly paymentsEnabled: boolean;
}
