import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapApiErrors } from '../../../core/http/api-error';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { AaptasGateway } from './aaptas.gateway';
import { AaptaAccount, AaptaAccountChanges, NewAapta } from './aaptas.models';

type AaptaProfileDto = Omit<AaptaAccount, 'id'> & { readonly aaptaId: string };

function toAccount({ aaptaId, ...profile }: AaptaProfileDto): AaptaAccount {
  return { id: aaptaId, ...profile };
}

@Injectable()
export class HttpAaptasGateway extends AaptasGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/admin/aaptas`;

  override getRoster(): Observable<AaptaAccount[]> {
    return this.http
      .get<{ aaptas: AaptaProfileDto[] }>(this.url)
      .pipe(map((response) => response.aaptas.map(toAccount)), mapApiErrors());
  }

  override create(aapta: NewAapta): Observable<AaptaAccount> {
    return this.http.post<AaptaProfileDto>(this.url, aapta).pipe(map(toAccount), mapApiErrors());
  }

  override update(aaptaId: string, changes: AaptaAccountChanges): Observable<AaptaAccount> {
    return this.http
      .patch<AaptaProfileDto>(this.aaptaUrl(aaptaId), changes)
      .pipe(map(toAccount), mapApiErrors());
  }

  override remove(aaptaId: string): Observable<{ readonly unallocatedBookings: number }> {
    return this.http
      .delete<{ unallocatedBookings: number }>(this.aaptaUrl(aaptaId))
      .pipe(mapApiErrors());
  }

  private aaptaUrl(aaptaId: string): string {
    return `${this.url}/${encodeURIComponent(aaptaId)}`;
  }
}
