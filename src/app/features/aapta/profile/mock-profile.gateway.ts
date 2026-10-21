import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { ProfileGateway } from './profile.gateway';
import { AaptaProfile, ProfileChanges } from './profile.models';

const LATENCY_MS = 400;

/** Stand-in for the profile API; matches the demo aapta (aapta@ksiracare.com) and remembers edits. */
@Injectable()
export class MockProfileGateway extends ProfileGateway {
  private profile: AaptaProfile = {
    firstName: 'Aanya',
    middleName: null,
    lastName: 'Mehta',
    email: 'aapta@ksiracare.com',
    phone: '+919876543210',
    dateOfBirth: '1991-03-14',
    languages: ['en', 'hi', 'mr'],
    address: 'Flat 402, Green Meadows, Pune 411014',
  };

  override getProfile(): Observable<AaptaProfile> {
    return timer(LATENCY_MS).pipe(map(() => this.profile));
  }

  override updateProfile(changes: ProfileChanges): Observable<AaptaProfile> {
    return timer(LATENCY_MS).pipe(map(() => (this.profile = { ...this.profile, ...changes })));
  }
}
