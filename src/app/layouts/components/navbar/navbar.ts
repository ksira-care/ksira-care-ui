import { Component, signal, effect, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, ModalComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {

  constructor() {
    effect(() => {
      // Toggle body scrolling based on mobile menu state
      if (this.isMenuOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        // Only restore the scroll if the modal component isn't also currently active 
        // and relying on the scroll lock.
        if (!this.isContactModalOpen()) {
          document.body.style.overflow = '';
        }
      }
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  navLinks = [
    { label: 'Treatments', route: '/treatmennts' },
    { label: 'Wellbeing Services', route: '/wellbeing-services' },
    { label: 'Blogs', route: '/blogs' },
    { label: 'About Us', route: '/contact' },
  ];
  isMenuOpen = signal(false);
  isContactModalOpen = signal(false);

  toggleNavbar() {
    this.isMenuOpen.update(v => !v);
  }

  openContactModal() {
    this.isContactModalOpen.set(true);
    // Auto-close menu if mobile menu is open
    this.isMenuOpen.set(false);
  }

  closeContactModal() {
    this.isContactModalOpen.set(false);
  }
}