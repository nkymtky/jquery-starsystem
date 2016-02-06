var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var rename = require('gulp-rename');

var jss = ['./src/header.js', './src/parts/*.js', './src/footer.js'];
gulp.task('js', function() {
  return gulp.src(jss)
    .pipe(plumber())
    .pipe(concat('jquery.starsystem.js'))
    .pipe(gulp.dest('./dist/'));
});

var sasses = ['./src/*.scss'];
gulp.task('sass', function() {
  return gulp.src(sasses)
    .pipe(plumber())
    .pipe(sass())
    .pipe(rename('jquery.starsystem.css'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() {
  gulp.watch(['./src/*.js', './src/parts/*.js'], ['js']);
  gulp.watch(['./src/*.scss'], ['sass']);
});
