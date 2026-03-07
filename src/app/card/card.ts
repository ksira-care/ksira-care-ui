import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ServiceCard {
    title: string;
    description: string;
    iconPath: string;
    iconColorClass: string;
}

export const SERVICES_DATA: ServiceCard[] = [
    {
        title: 'Expert Doctors',
        description: 'Connect with internationally trained specialists with proven track records in your required field.',
        iconPath: 'M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m4 0H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM12 12v6M9 15h6', // Centered medical bag SVG path matching 24x24 viewBox
        iconColorClass: 'text-rose'
    },
    {
        title: 'Travel Logistics',
        description: 'Complete visa assistance, medical documentation, and seamless airport transfers to your hospital or hotel.',
        iconPath: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
        iconColorClass: 'text-blue'
    },
    {
        title: 'Comfortable Accommodation',
        description: 'Relaxing, accessible stays near your healthcare facility with 24/7 support and premium amenities.',
        iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
        iconColorClass: 'text-teal'
    },
    {
        title: 'Dedicated Interpreters',
        description: 'Professional medical interpreters ensuring clear, accurate communication throughout your entire journey.',
        iconPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
        iconColorClass: 'text-purple'
    }
];

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.html',
    styleUrl: './card.scss'
})
export class Card {
    services = SERVICES_DATA;
}