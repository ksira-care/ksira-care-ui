import { provideHttpClient, withFetch } from '@angular/common/http';
import { Routes } from '@angular/router';
import { provideBookingApi } from './booking-api.providers';

/**
 * The public booking page. HTTP and the booking API are provided here, so the
 * rest of the public site neither downloads nor runs them.
 */
export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    providers: [provideHttpClient(withFetch()), provideBookingApi()],
    loadComponent: () => import('../../pages/book/book.component').then((m) => m.BookComponent),
  },
];
