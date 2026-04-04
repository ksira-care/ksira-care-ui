import { Component } from '@angular/core';
import { Hero } from '../../features/landing/components/hero/hero';
import { Card } from '../../features/landing/components/card/card';

@Component({
  selector: 'app-home',
  imports: [Hero, Card],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
