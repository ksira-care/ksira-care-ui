import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { CivilDate } from '../../../core/time/civil-date';
import { ProfileGateway } from './profile.gateway';
import { AaptaProfile, ProfileChanges } from './profile.models';

// ── Wire format ──────────────────────────────────────────────

interface ProfileDto {
  readonly aaptaId: string;
  readonly email: string;
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly phone: string | null;
  readonly dateOfBirth: CivilDate | null;
  readonly languages: readonly string[];
  readonly address: string | null;
}

/** Only the fields sent change; the API clears an optional text field with "". */
type ProfilePatchDto = { readonly [K in keyof ProfileChanges]?: Exclude<ProfileChanges[K], null> };

function toProfile(dto: ProfileDto): AaptaProfile {
  return {
    firstName: dto.firstName,
    middleName: dto.middleName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    dateOfBirth: dto.dateOfBirth,
    languages: dto.languages,
    address: dto.address,
  };
}

function toPatch(changes: ProfileChanges): ProfilePatchDto {
  return Object.fromEntries(
    Object.entries(changes).map(([field, value]) => [field, value === null ? '' : value]),
  ) as ProfilePatchDto;
}

@Injectable()
export class HttpProfileGateway extends ProfileGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/aaptas/me`;

  override getProfile(): Observable<AaptaProfile> {
    return this.http.get<ProfileDto>(this.url).pipe(map(toProfile));
  }

  override updateProfile(changes: ProfileChanges): Observable<AaptaProfile> {
    return this.http.patch<ProfileDto>(this.url, toPatch(changes)).pipe(map(toProfile));
  }
}
