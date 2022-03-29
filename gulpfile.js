'use strict';

var gulp = require('gulp'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass')(require('sass')),
    cssmin = require('gulp-minify-css');
     
var path = {
  build_app: {
    assets: 'cordova-www/app/assets/',
    js: 'cordova-www/app/build/js/',
    css: 'cordova-www/app/build/styles/',
    indx: 'cordova-www/'
  },
  
  src_app: {
    assets: 'app/assets/*/*',
    asset: 'app/assets/*.*',
    js:   ['app/src/js/*.js'],
    css: 'app/src/scss/styles.scss',
    vendors: 'app/src/scss/vendors/*.css',
    indx: 'app/php/templates/index.html'
  },
  
  build_desktop: {
    js: 'app/build/js/',
    css: 'app/build/styles/'
  },
  
  src_desktop: {
    js:   ['app/src/js/*.js'],
    css: 'app/src/scss/styles.scss',
    vendors: 'app/src/scss/vendors/*.css'
  },
  
  clean: './build'
};

gulp.task('assets:build', function (done) {
  gulp.src(path.src_app.assets)
    .pipe(gulp.dest(path.build_app.assets));
  gulp.src(path.src_app.asset)
    .pipe(gulp.dest(path.build_app.assets));
    done();
});

gulp.task('js:build', function (done) {
  gulp.src(path.src_desktop.js)
    //.pipe(sourcemaps.init())
    .pipe(uglify())
    //.pipe(concat('desktop.js'))
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build_desktop.js));
  gulp.src(path.src_app.js)
    //.pipe(sourcemaps.init())
    .pipe(uglify())
    //.pipe(concat('desktop.js'))
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build_app.js));
    
    done();
});

gulp.task('css:build', function (done) {
  gulp.src(path.src_desktop.css)
    //.pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(prefixer())
    .pipe(cssmin())
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build_desktop.css));
  gulp.src(path.src_app.css)
    //.pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(prefixer())
    .pipe(cssmin())
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build_app.css));    
    done();
});

gulp.task('vendors:build', function (done) {
  gulp.src(path.src_desktop.vendors)
    .pipe(prefixer())
    .pipe(cssmin())
    .pipe(gulp.dest(path.build_desktop.css));
  gulp.src(path.src_app.vendors)
    .pipe(prefixer())
    .pipe(cssmin())
    .pipe(gulp.dest(path.build_app.css));    
    done();
});

gulp.task('indx:build', function (done) {
  gulp.src(path.src_app.indx)
    .pipe(gulp.dest(path.build_app.indx));
    done();
});

gulp.task('clean', function (cb) {
  rimraf(path.clean, cb);
});

gulp.task('build', gulp.series(
  'assets:build',
  'js:build',
  'css:build',
  'vendors:build',
  'indx:build'
));

gulp.task('default', gulp.series('build'));