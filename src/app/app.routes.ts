import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
    },
    // {
    //     path: 'treatmennts',
    //     loadComponent: () => import('./pages/treatments/treatments').then(m => m.Treatments)
    // },
    // {
    //     path: 'wellbeing-services',
    //     loadComponent: () => import('./pages/wellbeing-services/wellbeing-services').then(m => m.WellbeingServices)
    // },
    {
        path: 'blogs',
        loadComponent: () => import('./pages/blogs/blogs').then(m => m.BlogsComponent)
    },
    // {
    //     path: 'contact',
    //     loadComponent: () => import('./pages/contact/contact').then(m => m.Contact)
    // }
];