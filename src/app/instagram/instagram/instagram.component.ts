import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { ActivatedRoute, Router } from '@angular/router';

import { ReactiveFormsModule } from '@angular/forms';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ElectronService } from 'ngx-electron';
import { InstagramService } from '../instagram.service'
import { Http } from '@angular/http';


@Component({
  selector: 'app-instagram',
  templateUrl: './instagram.component.html',
  styleUrls: ['./instagram.component.scss']
})
export class InstagramComponent implements OnInit {

  searchQuery: FormGroup;
  basicUserData;
  advancedUserData;
  media: any[] = [];
  username = '';
  loaded = false;
  stats;
  mostLikedMedia = [];
  mostCommentedMedia = [];
  summary = [
    { key: 'Posts', value: '' },
    { key: 'Followers', value: '' },
    { key: 'Following', value: '' }
  ]

  engagements = [
    { key: 'Total likes', value: '' },
    { key: 'Total comments', value: '' },
    { key: 'Average likes', value: '' },
    { key: 'Average comments', value: '' }
  ]

  sampleSize;
  statMethod;

  constructor(private http: Http,
    private instagramService: InstagramService,
    private fb: FormBuilder,
    private electronService: ElectronService,
    private route: ActivatedRoute,
    private router: Router) {
    this.createForm();
  }

  ngOnInit() {
    this.route
    .queryParams
    .subscribe(params => {
      this.username = params['user'] || '';
      if(this.username.length > 0)
        this.search();
    });

    
  }
  createForm() {
    this.searchQuery = this.fb.group({
      username: ['', Validators.required],
    });
  }

  search() {
    if(this.username.length <= 0)    
      this.username = this.searchQuery.value.username.trim();
      
    else {
    this.getUserData();
    // this.getMockData()
    // this.getFullStats();
    // this.getQuickStats();   //recommended
    
    this.router.navigate(['instagram'], { queryParams: { user: this.username.trim()} });
    }
  }
  externalUrl(url) {
    var shell = this.electronService.shell;
    if (shell)
      shell.openExternal(url);
    else
      window.open(url);
  }
  getMockData() {
    this.http.get('./assets/mockStats.json')
      .subscribe(res => {
        this.stats = res;
        this.statMethod = 'quick';
        this.populateStats();
      })
  }
 
  //this is the logic that usually works but has not been reliable since Instagram started making changes to it s API endpoints in April 2018
  // getUserData() {
  //   this.instagramService.getUserByUsername(this.username)
  //     .subscribe((basicUserData) => {
  //       this.basicUserData = basicUserData;
  //       this.instagramService.getUserById(this.basicUserData.graphql.user.id)
  //         .subscribe((advancedUserData) => {
  //           this.advancedUserData = advancedUserData
  //           this.stats = this.instagramService.getStats(this.advancedUserData.data.user.edge_owner_to_timeline_media.edges, this.basicUserData.graphql.user, this.username, 6);
  //           this.statMethod = 'quick';
  //           this.populateStats();
  //         })
  //     })
  // }


  //temporary workaround while Instagram's API endpoints are unstable
  getUserData() {
    this.http.get('https://www.instagram.com/' + this.username)
      .subscribe((data) => {
        var userData = JSON.parse(data['_body'].split('"ProfilePage":[')[1].split(']},"gatekeepers"')[0])
        this.basicUserData = userData
        this.stats = this.instagramService.getStats(userData.graphql.user.edge_owner_to_timeline_media.edges, userData.graphql.user, this.username, 6);
        this.statMethod = 'quick';
        this.populateStats();
      })
  }
  getQuickStats() {
    this.electronService.remote.require('./main.js').instalytics.getQuickStats(this.username, 6)
      .then(
      res => {
        this.stats = res;
        this.statMethod = 'quick'
        this.populateStats();
      });
  }
  getFullStats() {
    this.electronService.remote.require('./main.js').instalytics.getFullStats(this.username, 6, 30000)
      .then(
      res => {
        this.statMethod = 'full'
        this.stats = res;
        this.populateStats();
      });
  }
  
  populateStats() {
    this.summary[0].value = this.stats.posts;
    this.summary[1].value = this.stats.followers;
    this.summary[2].value = this.stats.following;

    this.engagements[0].value = this.stats.totalLikes;
    this.engagements[1].value = this.stats.totalComments;
    this.engagements[2].value = this.stats.averageLikes;
    this.engagements[3].value = this.stats.averageComments;

    this.mostLikedMedia = this.stats.mostLikedMedia;
    this.mostCommentedMedia = this.stats.mostCommentedMedia;
    this.sampleSize = this.basicUserData.graphql.user.edge_owner_to_timeline_media.edges.length;
    this.loaded = true;
  }
}
