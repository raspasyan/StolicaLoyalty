'use strict';

var gulp = require('gulp'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass')(require('sass')),
    cssmin = require('gulp-minify-css');
     
var path = {
  build_desktop: {
    js: 'app/assets/js/',
    css: 'app/assets/styles/',
    vendors: 'app/assets/styles/'
  },
  
  src_desktop: {
    js:   ['app/js/*.js'],
    css: 'app/scss/styles.scss',
    vendors: 'app/scss/vendors/*.css'
  },
  
  clean: './build'
};

gulp.task('js:build', function (done) {
  gulp.src(path.src_desktop.js)
    //.pipe(sourcemaps.init())
    .pipe(uglify())
    //.pipe(concat('desktop.js'))
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build_desktop.js));
    
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
    
    done();
});

gulp.task('vendors:build', function (done) {
  gulp.src(path.src_desktop.vendors)
    .pipe(prefixer())
    .pipe(cssmin())
    .pipe(gulp.dest(path.build_desktop.css));
    done();
});

gulp.task('clean', function (cb) {
  rimraf(path.clean, cb);
});

gulp.task('build', gulp.series(
  'js:build',
  'css:build',
  'vendors:build'
));

gulp.task('default', gulp.series('build'));