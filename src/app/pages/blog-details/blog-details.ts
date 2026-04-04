import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog';

@Component({
  selector: 'app-blog-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-details.html',
  styleUrls: ['./blog-details.scss']
})
export class BlogDetailsComponent implements OnInit {
  blog: BlogPost | undefined;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.blog = this.blogService.getBlogBySlug(slug);
        // Scroll to top on load effortlessly
        window.scrollTo(0, 0);
      }
    });
  }
}
