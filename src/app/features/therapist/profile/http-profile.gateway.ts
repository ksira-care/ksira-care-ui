import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { ProfileGateway } from './profile.gateway';
import { PostalAddress, TherapistProfile } from './profile.models';

// ── Wire format (as proposed to backend) ─────────────────────

interface AddressDto {
  readonly line1?: string | null;
  readonly line2?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}

interface ProfileDto {
  readonly email: string;
  readonly firstName?: string | null;
  readonly middleName?: string | null;
  readonly lastName?: string | null;
  /** Single-string name from the first API draft. */
  readonly name?: string | null;
  readonly phone?: string | null;
  /** YYYY-MM-DD */
  readonly dateOfBirth?: string | null;
  readonly languages?: readonly string[] | null;
  /** Structured, or a single line from the first API draft. */
  readonly address?: AddressDto | string | null;
}

function toAddress(dto: ProfileDto['address']): PostalAddress | null {
  if (!dto) return null;
  if (typeof dto === 'string') {
    return { line1: dto, line2: null, city: '', state: null, postalCode: '', country: null };
  }
  return {
    line1: dto.line1 ?? '',
    line2: dto.line2 || null,
    city: dto.city ?? '',
    state: dto.state || null,
    postalCode: dto.postalCode ?? '',
    country: dto.country || null,
  };
}

function toProfile(dto: ProfileDto): TherapistProfile {
  const nameParts = [dto.firstName, dto.middleName, dto.lastName].filter(Boolean);
  return {
    fullName: nameParts.length ? nameParts.join(' ') : (dto.name ?? ''),
    email: dto.email,
    phone: dto.phone || null,
    dateOfBirth: dto.dateOfBirth || null,
    languages: dto.languages ?? [],
    address: toAddress(dto.address),
  };
}

@Injectable()
export class HttpProfileGateway extends ProfileGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/therapists/me`;

  override getProfile(): Observable<TherapistProfile> {
    return this.http.get<ProfileDto>(this.url).pipe(map(toProfile));
  }
}
