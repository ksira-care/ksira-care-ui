import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { ProfileGateway } from './profile.gateway';
import { TherapistProfile } from './profile.models';

const LATENCY_MS = 400;

/** Matches the mock signed-in therapist (therapist@ksiracare.com). */
const MOCK_PROFILE: TherapistProfile = {
  fullName: 'Aanya Mehta',
  email: 'therapist@ksiracare.com',
  phone: '+919876543210',
  dateOfBirth: '1991-03-14',
  languages: ['en', 'hi', 'mr'],
  address: {
    line1: 'Flat 402, Green Meadows',
    line2: null,
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411014',
    country: 'IN',
  },
};

@Injectable()
export class MockProfileGateway extends ProfileGateway {
  override getProfile(): Observable<TherapistProfile> {
    return timer(LATENCY_MS).pipe(map(() => MOCK_PROFILE));
  }
}
