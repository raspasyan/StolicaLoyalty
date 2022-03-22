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
    js: 'app/js/',
    css: 'app/styles/'
  },
  
  src_desktop: {
    js:   ['app/src/js/*.js'],
    style: 'app/src/styles/*.css'
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
  gulp.src(path.src_desktop.style)
    //.pipe(sourcemaps.init())
    //.pipe(sass())
    .pipe(prefixer())
    .pipe(cssmin())
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build_desktop.css));
    
    done();
});

gulp.task('clean', function (cb) {
  rimraf(path.clean, cb);
});

gulp.task('build', gulp.series(
  'js:build',
  'css:build'
));

gulp.task('default', gulp.series('build'));