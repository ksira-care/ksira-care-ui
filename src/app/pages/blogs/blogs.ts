// blog.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog';

@Component({
  selector: 'app-blog',
  templateUrl: './blogs.html',
  styleUrls: ['./blogs.scss'],
  imports: [CommonModule, RouterModule]
})
export class BlogComponent implements OnInit {
  featuredPost: BlogPost | undefined;
  regularPosts: BlogPost[] = [];

  constructor(private blogService: BlogService) { }

  ngOnInit(): void {
    const blogs = this.blogService.getAllBlogs();
    this.featuredPost = blogs.find(b => b.isFeatured);
    this.regularPosts = blogs.filter(b => !b.isFeatured);
  }

  getImagePlaceholder(title: string): string {
    return title.charAt(0).toUpperCase();
  }
}
