// blog.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image?: string;
  isFeatured?: boolean;
}

@Component({
  selector: 'app-blog',
  templateUrl: './blogs.html',
  styleUrls: ['./blogs.scss'],
  imports: [CommonModule]
})
export class BlogComponent implements OnInit {
  blogs: BlogPost[] = [
    {
      slug: 'ultimate-guide-medical-tourism',
      id: '1',
      title: 'The Ultimate Guide to Medical Tourism: Everything You Need to Know',
      excerpt: 'Discover how medical tourism can provide you with world-class healthcare at affordable costs. Learn about choosing the right destination, hospital, and doctor.',
      category: 'Travel Guide',
      author: 'Dr. Sarah Johnson',
      date: 'March 15, 2026',
      readTime: '12',
      image: '/assets/blogs/blog-featured.jpg',
      isFeatured: true,
    },
    {
      slug: 'cost-comparison-dental-surgery',
      id: '2',
      title: 'Cost Comparison: Dental Surgery Abroad vs Your Home Country',
      excerpt: 'See how you can save up to 70% on dental procedures by traveling to our partner hospitals. We break down the cost analysis and recovery timeline.',
      category: 'Cost Savings',
      author: 'Dr. Michael Chen',
      date: 'March 10, 2026',
      readTime: '8',
      image: '/assets/blogs/blog-3.jpg',
    },
    {
      slug: 'orthopedic-treatment-recovery',
      id: '3',
      title: 'Joint Replacement Surgery: Recovery Timeline and Post-Treatment Care',
      excerpt: 'Learn what to expect after orthopedic surgery, including rehabilitation exercises, pain management, and when you can resume normal activities.',
      category: 'Treatment Guide',
      author: 'Dr. Raj Patel',
      date: 'March 5, 2026',
      readTime: '10',
      image: '/assets/blogs/blog-4.jpg',
    },
    {
      slug: 'visa-process-medical-tourism',
      id: '4',
      title: 'Medical Visa Guide: Streamlined Process for International Patients',
      excerpt: 'Understand the visa requirements, documentation needed, and how we assist with your medical tourism visa application to make your journey hassle-free.',
      category: 'Travel Tips',
      author: 'Sarah Williams',
      date: 'February 28, 2026',
      readTime: '7',
      image: '/assets/blogs/blog-5.jpg',
    },
    {
      slug: 'choosing-right-hospital',
      id: '5',
      title: 'How to Choose the Right Hospital for Your Medical Procedure',
      excerpt: 'Accreditation, doctor credentials, success rates, and facility quality matter. Here\'s a comprehensive checklist to help you make the best decision.',
      category: 'Hospital Guide',
      author: 'Dr. Emma Roberts',
      date: 'February 20, 2026',
      readTime: '9',
      image: '/assets/blogs/blog-1.jpg',
    },
    {
      slug: 'cardiac-treatment-success-stories',
      id: '6',
      title: 'Cardiac Care Excellence: Success Stories from Our Heart Surgery Patients',
      excerpt: 'Read inspiring patient testimonials about successful heart surgeries and how we provided comprehensive care throughout their medical journey.',
      category: 'Success Stories',
      author: 'Dr. James Wilson',
      date: 'February 15, 2026',
      readTime: '11',
      image: '/assets/blogs/blog-2.jpg',
    },
  ];

  featuredPost: BlogPost | undefined;
  regularPosts: BlogPost[] = [];

  constructor() { }

  ngOnInit(): void {
    this.featuredPost = this.blogs.find(b => b.isFeatured);
    this.regularPosts = this.blogs.filter(b => !b.isFeatured);
  }

  getImagePlaceholder(title: string): string {
    return title.charAt(0).toUpperCase();
  }
}


