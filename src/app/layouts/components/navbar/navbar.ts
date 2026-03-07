import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {


  navLinks = [
    { label: 'Treatments', route: '/treatmennts' },
    { label: 'Wellbeing Services', route: '/wellbeing-services' },
    { label: 'Blogs', route: '/blogs' },
    { label: 'About Us', route: '/contact' },
  ];
  isMenuOpen = signal(false);

  toggleNavbar() {
    this.isMenuOpen.update(v => !v);
  }
}