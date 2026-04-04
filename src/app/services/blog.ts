import { Injectable } from '@angular/core';

export interface BlogPost {
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
  content?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly defaultContent = `
    <h2>Introduction to Medical Tourism</h2>
    <p>Medical tourism has revolutionized the way patients access healthcare. By combining travel and medical treatment, patients can receive world-class care at a fraction of the cost they would pay in their home countries.</p>
    
    <h2>Why Choose Medical Tourism?</h2>
    <p>The benefits of medical tourism are numerous:</p>
    <ul>
      <li><strong>Cost Savings:</strong> Save up to 70% on medical procedures</li>
      <li><strong>World-Class Facilities:</strong> Internationally accredited hospitals</li>
      <li><strong>Expert Doctors:</strong> Highly trained medical professionals</li>
      <li><strong>Minimal Wait Times:</strong> Quick treatment without waiting lists</li>
      <li><strong>Comprehensive Support:</strong> Visa assistance and accommodation</li>
    </ul>

    <h2>Popular Procedures</h2>
    <p>Popular procedures include:</p>
    <ul>
      <li>Orthopedic Surgery</li>
      <li>Dental Procedures</li>
      <li>Cardiac Surgery</li>
      <li>Cosmetic Surgery</li>
      <li>Gynecological Procedures</li>
    </ul>

    <h2>The Process</h2>
    <p>Our streamlined process includes:</p>
    <ol>
      <li>Initial Consultation</li>
      <li>Medical Records Review</li>
      <li>Cost Estimate</li>
      <li>Travel & Visa Assistance</li>
      <li>Hospital Arrangements</li>
      <li>Pre-operative Tests</li>
      <li>Surgery & Recovery</li>
      <li>Post-operative Support</li>
    </ol>

    <h2>Conclusion</h2>
    <p>Medical tourism offers excellent opportunities to access world-class healthcare at affordable prices. Contact us to begin your medical journey.</p>
  `;

  private blogs: BlogPost[] = [
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
      content: this.defaultContent
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
      content: this.defaultContent
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
      content: this.defaultContent
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
      content: this.defaultContent
    },
    {
      slug: 'choosing-right-hospital',
      id: '5',
      title: 'How to Choose the Right Hospital for Your Medical Procedure',
      excerpt: "Accreditation, doctor credentials, success rates, and facility quality matter. Here's a comprehensive checklist to help you make the best decision.",
      category: 'Hospital Guide',
      author: 'Dr. Emma Roberts',
      date: 'February 20, 2026',
      readTime: '9',
      image: '/assets/blogs/blog-1.jpg',
      content: this.defaultContent
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
      content: this.defaultContent
    }
  ];

  getAllBlogs(): BlogPost[] {
    return this.blogs;
  }

  getBlogBySlug(slug: string): BlogPost | undefined {
    return this.blogs.find(b => b.slug === slug);
  }
}
