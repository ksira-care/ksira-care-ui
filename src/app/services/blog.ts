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
      content: `
        <h2>Introduction to Medical Tourism</h2>
        <p>Medical tourism has revolutionized the way patients access healthcare globally. By combining international travel and advanced medical treatment, patients can receive world-class care at a fraction of the cost they would typically pay in their home countries.</p>
        
        <h2>Why Choose Medical Tourism?</h2>
        <p>The benefits of seeking medical care abroad go far beyond just saving money:</p>
        <ul>
          <li><strong>Cost Savings:</strong> Save up to 70% on major medical procedures.</li>
          <li><strong>World-Class Facilities:</strong> Access internationally accredited hospitals equipped with the latest technology.</li>
          <li><strong>Expert Doctors:</strong> Be treated by highly trained medical professionals, many of whom have practiced globally.</li>
          <li><strong>Minimal Wait Times:</strong> Receive quick treatment without being placed on exhaustive waiting lists.</li>
          <li><strong>Comprehensive Support:</strong> Benefit from dedicated travel, visa assistance, and post-operative accommodation support.</li>
        </ul>

        <h2>Popular Procedures</h2>
        <p>While almost any procedure can be performed abroad, the most popular include:</p>
        <ul>
          <li>Orthopedic Surgery (Knee, Hip, Spine)</li>
          <li>Comprehensive Dental Procedures</li>
          <li>Complex Cardiac Surgery</li>
          <li>Cosmetic & Reconstructive Surgery</li>
          <li>Advanced Gynecological Procedures</li>
        </ul>

        <h2>The Process</h2>
        <p>A properly structured medical journey ensures safety and comfort. Our streamlined process includes:</p>
        <ol>
          <li>Initial Virtual Consultation with Medical Staff</li>
          <li>Comprehensive Medical Records Review</li>
          <li>Transparent Cost Estimate & Itinerary Building</li>
          <li>Dedicated Travel & Visa Assistance</li>
          <li>Hospital Arrangements & Airport Transfers</li>
          <li>Pre-operative Testing & Surgeon Consultation</li>
          <li>Surgery & In-Patient Recovery</li>
          <li>Post-operative Support & Return Flight Clearance</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Medical tourism offers an excellent opportunity to access world-class healthcare at deeply affordable prices, packaged within a supportive environment. Contact our specialists today to begin planning your personalized medical journey.</p>
      `
    },
    {
      slug: 'cost-comparison-dental-surgery',
      id: '2',
      title: 'Cost Comparison: Dental Surgery Abroad vs Your Home Country',
      excerpt: "See how you can save up to 70% on dental procedures by traveling to our partner hospitals. We break down the cost analysis and recovery timeline.",
      category: 'Cost Savings',
      author: 'Dr. Michael Chen',
      date: 'March 10, 2026',
      readTime: '8',
      image: '/assets/blogs/blog-3.jpg',
      content: `
        <h2>The High Cost of Dental Care at Home</h2>
        <p>For many patients, essential dental procedures like implants, veneers, and full-mouth restorations are prohibitively expensive in their home countries. Without comprehensive insurance coverage, simple procedures can quickly spiral into the tens of thousands of dollars.</p>
        
        <h2>Breaking Down the Savings</h2>
        <p>When traveling abroad for dental procedures, the savings are immediate and significant. Here is an average cost comparison:</p>
        <ul>
          <li><strong>Single Dental Implant:</strong> Averages $3,000 - $4,500 in the US/UK vs $800 - $1,200 abroad.</li>
          <li><strong>Porcelain Veneers:</strong> Averages $1,000 - $2,500 per tooth at home vs $250 - $400 per tooth abroad.</li>
          <li><strong>All-on-4 Full Mouth Restoration:</strong> Can exceed $25,000 at home vs just $8,000 - $10,000 abroad.</li>
        </ul>

        <h2>Does Lower Cost Mean Lower Quality?</h2>
        <p>Absolutely not. The dramatic difference in pricing is due to lower administrative costs, reduced labor expenses, and favorable exchange rates—not a drop in material or surgical quality. Our partner dental clinics rely on the exact same titanium implants (e.g., Straumann, Nobel Biocare) and state-of-the-art 3D imaging technology commonly found in Beverly Hills or London.</p>

        <h2>The Dental Vacation Experience</h2>
        <p>Dental procedures typically require minimal physical recovery time compared to major invasive surgeries. This means patients can spend their recovery days exploring their destination city, transforming a stressful medical necessity into a relaxing vacation.</p>
        
        <h2>Conclusion</h2>
        <p>By traveling abroad for major dental work, patients frequently save enough money to cover the cost of their flights and premium hotel accommodations—and still return home with thousands of dollars in savings and a brand new smile.</p>
      `
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
      content: `
        <h2>Understanding Joint Replacement Recovery</h2>
        <p>Whether you've undergone a total knee, hip, or shoulder replacement, understanding the recovery timeline is crucial for ensuring a fully successful surgical outcome. Joint replacement is highly transformative, but the patient's commitment to physical therapy is just as important as the surgeon's skill.</p>
        
        <h2>Immediately Post-Surgery (Days 1 to 3)</h2>
        <p>Recovery begins the moment you wake up. During these crucial first days:</p>
        <ul>
          <li><strong>Pain Management:</strong> Intravenous or epidural pain relief ensures constant comfort.</li>
          <li><strong>Initial Movement:</strong> Under the supervision of a physical therapist, you will likely be encouraged to stand and take a few steps on the same day as your surgery.</li>
          <li><strong>Blood Clot Prevention:</strong> Compression stockings and supervised leg movements begin immediately.</li>
        </ul>

        <h2>The Short-Term Rehabilitation (Weeks 1 to 3)</h2>
        <p>As you transition out of the hospital to your recovery accommodation or fly home, daily physical therapy sessions become the primary focus.</p>
        <ul>
          <li>Swelling will begin to visibly decrease.</li>
          <li>Patients usually transition from utilizing a walker to a cane or walking stick.</li>
          <li>Prescription pain medications are slowly phased out in favor of over-the-counter anti-inflammatories.</li>
        </ul>

        <h2>Mid-Term to Long-Term Recovery (Weeks 4 to 12)</h2>
        <p>This is when patients regain independence. By week six, most patients resume driving and can complete mild daily chores without exhaustion. By week twelve, joint strength is significantly restored, and low-impact activities like swimming and cycling can be cautiously introduced.</p>

        <h2>Conclusion</h2>
        <p>A successful joint replacement requires time, patience, and professional guidance. By following your personalized physical therapy roadmap closely, you can look forward to years of pain-free mobility.</p>
      `
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
      content: `
        <h2>Demystifying the Medical Visa Process</h2>
        <p>Traveling across international borders for medical procedures might sound complex, but with the correct documentation, securing a medical visa is an incredibly streamlined and heavily supported process.</p>
        
        <h2>What is a Medical Visa?</h2>
        <p>A Medical Visa is a specific travel authorization granted by a foreign government for the express purpose of undergoing medical treatment. These visas are often prioritized, fast-tracked, and typically require less stringent financial ties than standard tourist visas, provided you have hospital sponsorship.</p>

        <h2>Crucial Documentation Required</h2>
        <p>Every country has minor variations in their requirements, but universally, you will need to prepare the following documents:</p>
        <ol>
          <li><strong>Hospital Invitation Letter:</strong> An official document from the receiving hospital confirming your treatment dates, surgeon details, and the facility's commitment to treating you.</li>
          <li><strong>Medical Diagnosis:</strong> A letter from your local doctor detailing your condition and affirming the necessity of seeking specialized treatment.</li>
          <li><strong>Proof of Funds:</strong> Bank statements or insurance confirmations demonstrating your ability to pay for the medical procedures and your stay.</li>
          <li><strong>Valid Passport:</strong> With at least six months of remaining validity.</li>
        </ol>

        <h2>How We Assist You</h2>
        <p>We believe that your focus should be strictly on your health and recovery, not on stressful embassy paperwork. Our concierge teams directly communicate with our partner hospitals to generate your official Medical Invitation Letters, and we provide dedicated case managers who review your visa application step-by-step prior to submission.</p>
        
        <h2>Conclusion</h2>
        <p>Bureaucracy should never stand in the way of your health. With the proper guidance and robust hospital sponsorship, securing a medical visa is a fast and predictable milestone in your medical tourism journey.</p>
      `
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
      content: `
        <h2>The Importance of Hospital Selection</h2>
        <p>When traveling abroad for healthcare, selecting the right facility is the single most critical decision you will make. It determines your surgical outcome, your level of comfort, and your physical safety. But how do you filter through thousands of international clinics?</p>
        
        <h2>International Accreditation is Non-Negotiable</h2>
        <p>Never rely solely on a hospital's sleek website. The global gold standard for hospital quality is the <strong>JCI (Joint Commission International)</strong> accreditation. A hospital with JCI accreditation operates under the exact same strict hygiene, safety, and infrastructure protocols required by elite hospitals in the United States.</p>
        <ul>
          <li>Check the official JCI website to verify the hospital’s status.</li>
          <li>Look for secondary local accreditations (like ISQua or ISO 9001).</li>
        </ul>

        <h2>Evaluating the Surgeon</h2>
        <p>A great hospital is nothing without a brilliant surgical team. Ensure your specific doctor possesses global credentials.</p>
        <ul>
          <li>Where did the surgeon complete their residency or fellowship?</li>
          <li>Are they board-certified in their specialty?</li>
          <li>How many times have they fundamentally performed your specific procedure? (Volume implies mastery).</li>
        </ul>

        <h2>Technology and Translators</h2>
        <p>Advanced surgeries require advanced machinery. Does the hospital use robotics (like the Da Vinci Surgical System)? Just as importantly, does the hospital have a dedicated international patient department that provides fluent, medically trained translators for your native language?</p>

        <h2>Conclusion</h2>
        <p>By verifying JCI accreditation, deeply researching surgical credentials, and ensuring strong translation and technological infrastructure, you can confidently choose an international hospital that often exceeds the standards found at home.</p>
      `
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
      content: `
        <h2>Transforming Lives Across Borders</h2>
        <p>Cardiac surgery is inherently daunting. Adding international travel to the equation requires immense trust. In this article, we share the deeply inspiring journeys of three international patients who chose our partner cardiovascular institutes to reclaim their lives.</p>
        
        <h2>John's Journey: Beating the Waiting List</h2>
        <p>John, a 62-year-old from Canada, was placed on a fourteen-month waiting list for a crucial coronary artery bypass graft (CABG). Unwilling to risk his health for over a year, John partnered with KsiraCare.</p>
        <p>"Within three weeks, I was lying in a private suite in a JCI-accredited hospital in Asia," John recalls. "The surgical team was led by a surgeon who had trained for a decade at the Cleveland Clinic. Today, my heart function is flawless, and the total cost, flights included, was less than my deductible at home."</p>

        <h2>Maria's Minimally Invasive Valve Replacement</h2>
        <p>Maria required a mitral valve replacement but dreaded the idea of an open-heart sternotomy. Traveling to our affiliated European Cardiac Center, she was treated using advanced robotic-assisted minimally invasive techniques. Her recovery time was slashed in half, and her surgical scar is practically invisible.</p>

        <h2>The Standard of Care</h2>
        <p>These stories underscore a vital truth: international cardiac care frequently offers technology and responsiveness that local healthcare systems struggle to immediately provide. Complete transparency, dedicated English-speaking nursing staff, and uncompromised surgical brilliance make these success stories a daily occurrence.</p>

        <h2>Conclusion</h2>
        <p>If you're facing overwhelming costs or terrifying waiting lists for crucial cardiac care, you have world-class alternatives. Reach out to our team to discover how your own success story can begin today.</p>
      `
    }
  ];

  getAllBlogs(): BlogPost[] {
    return this.blogs;
  }

  getBlogBySlug(slug: string): BlogPost | undefined {
    return this.blogs.find(b => b.slug === slug);
  }
}
